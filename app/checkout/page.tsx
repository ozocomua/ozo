"use client"

import { useCart } from "@/lib/cart-context"
import { ArrowLeft, MapPin, Box, Home, Check, CreditCard, Wallet, Loader2, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import CodWarningModal from "@/components/cod-warning-modal"

const TOP_CITIES = [
  { name: "Київ", ref: "8d5a980d-391c-11dd-90d9-001a92567626" },
  { name: "Одеса", ref: "db5c88d0-391c-11dd-90d9-001a92567626" },
  { name: "Львів", ref: "db5c88f5-391c-11dd-90d9-001a92567626" },
  { name: "Дніпро", ref: "db5c88c6-391c-11dd-90d9-001a92567626" },
  { name: "Харків", ref: "db5c88e0-391c-11dd-90d9-001a92567626" }
];

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart, updateQuantity, removeFromCart, refreshPrices, pricesRefreshed } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({ 
    firstName: '', lastName: '', middleName: '', phone: '+380', comment: '', noCall: false // Змінено на +380
  })
  
  const [cities, setCities] = useState<any[]>([])
  const [deliveryPoints, setDeliveryPoints] = useState<any[]>([])
  const [selectedCity, setSelectedCity] = useState({ ref: '', name: '' })
  const [deliveryType, setDeliveryType] = useState<'warehouse' | 'postomat' | 'courier'>('warehouse')
  
  const [paymentType, setPaymentType] = useState<'card' | 'cod'>('card')
  const [showCodWarning, setShowCodWarning] = useState(false)
  const [codConfig, setCodConfig] = useState({ enabled: false, title: "", message: "", okLabel: "", cancelLabel: "" })

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.codWarning) setCodConfig(data.codWarning)
      })
      .catch(() => {})
  }, [])
  
  const [pointInput, setPointInput] = useState('')
  const [cityInput, setCityInput] = useState('')
  const [selectedPoint, setSelectedPoint] = useState('')
  
  const [courierData, setCourierData] = useState({ house: '', apartment: '', entrance: '', floor: '' })

  const [showCities, setShowCities] = useState(false)
  const [showPoints, setShowPoints] = useState(false)
  const [isLoadingPoints, setIsLoadingPoints] = useState(false)

  useEffect(() => {
    refreshPrices()
  }, [])

  const fetchCities = async (query: string = "") => {
    if (query.length === 0) {
      setCities(TOP_CITIES.map(c => ({ Description: c.name, Ref: c.ref })));
      return;
    }
    try {
      const res = await fetch('/api/novaposhta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: 'Address', calledMethod: 'getCities',
          methodProperties: { FindByString: query, Limit: "15" }
        })
      })
      const data = await res.json()
      if (data.success) setCities(data.data)
    } catch (err) { console.error(err) }
  }

  const fetchPoints = async (query: string = "") => {
    if (!selectedCity.ref) return
    setIsLoadingPoints(true)
    const isCourier = deliveryType === 'courier'
    
    try {
      const res = await fetch('/api/novaposhta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: 'Address',
          calledMethod: isCourier ? 'getStreet' : 'getWarehouses',
          methodProperties: isCourier 
            ? { CityRef: selectedCity.ref, FindByString: query, Limit: "30" }
            : { CityRef: selectedCity.ref, FindByString: query, Limit: "500" } 
        })
      })
      const data = await res.json()
      if (data.success && data.data) {
        if (isCourier) {
          setDeliveryPoints(data.data)
        } else {
          const filtered = data.data.filter((item: any) => {
            const isPostomat = item.Description.toLowerCase().includes('поштомат') || 
                               item.TypeOfWarehouse === "f6552995-1f93-11e2-896d-0026b97ed48a";
            return deliveryType === 'postomat' ? isPostomat : !isPostomat;
          })
          setDeliveryPoints(filtered.slice(0, 100))
        }
      }
    } catch (err) { console.error(err) }
    setIsLoadingPoints(false)
  }

  useEffect(() => {
    if (cityInput.length >= 2) {
      const timer = setTimeout(() => fetchCities(cityInput), 400)
      return () => clearTimeout(timer)
    } else if (cityInput.length === 0 && showCities) {
      fetchCities("") 
    }
  }, [cityInput, showCities])

  useEffect(() => {
    if (selectedCity.ref) {
      fetchPoints(pointInput)
    }
  }, [selectedCity.ref, deliveryType, pointInput])

  // ОНОВЛЕНА ЛОГІКА ТЕЛЕФОНУ
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Гарантуємо, що номер починається з +380
    if (!value.startsWith('+380')) {
      value = '+380';
    }

    // Залишаємо тільки плюс і цифри, обмежуємо до 13 символів
    const cleaned = '+' + value.slice(1).replace(/\D/g, '');
    if (cleaned.length <= 13) {
      setFormData({ ...formData, phone: cleaned });
    }
  }

  const handleSubmit = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert("Вкажіть ім'я та прізвище")
      return
    }
    setIsSubmitting(true)

    const paymentLabels: Record<string, string> = {
      card: "Оплата карткою",
      cod: "Накладний платіж"
    }

    const orderData = {
      phone: formData.phone,
      firstName: formData.firstName,
      lastName: formData.lastName,
      middleName: formData.middleName,
      noCall: formData.noCall,
      comment: formData.comment,
      deliveryType: deliveryType,
      city: selectedCity,
      deliveryPoint: selectedPoint,
      courier: courierData,
      items: cart.map(item => `${item.name} x${item.quantity}`).join(", "),
      orderItems: cart.map(item => ({ productId: Number(item.productId ?? item.id), cartItemId: item.id, quantity: item.quantity })),
      total: cartTotal,
      delivery: `${selectedCity.name}, ${selectedPoint}`,
      paymentType: paymentType
    }

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Помилка при створенні замовлення')
      }
      
      clearCart()
      
      if (paymentType === 'card' && result.paymentUrl) {
        const payParams = new URLSearchParams({
          id: result.orderId,
          total: orderData.total.toString(),
          delivery: orderData.delivery,
          items: orderData.items,
          paymentUrl: result.paymentUrl,
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName,
          phone: formData.phone,
          noCall: String(formData.noCall),
        })
        window.location.href = `/checkout/pay?${payParams.toString()}`
      } else if (paymentType === 'cod') {
        const successParams = new URLSearchParams({
          id: result.orderId,
          total: orderData.total.toString(),
          delivery: orderData.delivery,
          items: orderData.items,
          payment: paymentLabels[paymentType],
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName,
          phone: formData.phone,
          noCall: String(formData.noCall),
        })
        window.location.href = `/checkout/success?${successParams.toString()}`
      }
    } catch (err: any) {
      console.error(err)
      alert(`Помилка: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  };

  if (cart.length === 0) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7]">
      <div className="text-center space-y-6">
        <h2 className="text-4xl font-serif italic opacity-20 uppercase tracking-widest">Кошик порожній</h2>
        <Link href="/" className="inline-block text-[10px] font-bold uppercase tracking-widest border-b border-black pb-1">Повернутися до каталогу</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F9F9F7] pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-10">
        <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-10 opacity-50 hover:opacity-100 transition-opacity">
          <ArrowLeft size={14} /> Назад
        </Link>

        <div className="grid lg:grid-cols-[1fr_450px] gap-8 lg:gap-16">
          <div className="space-y-12">
            <h2 className="text-4xl font-serif italic tracking-tight">Оформлення</h2>
            
            <div className="space-y-8">
              <div className="grid md:grid-cols-3 gap-4">
                <input className="w-full bg-white rounded-2xl p-5 shadow-sm outline-none focus:ring-2 focus:ring-[#00B5D1] transition-all" placeholder="Прізвище" onChange={e => setFormData({...formData, lastName: e.target.value})} />
                <input className="w-full bg-white rounded-2xl p-5 shadow-sm outline-none focus:ring-2 focus:ring-[#00B5D1] transition-all" placeholder="Ім'я" onChange={e => setFormData({...formData, firstName: e.target.value})} />
                <input className="w-full bg-white rounded-2xl p-5 shadow-sm outline-none focus:ring-2 focus:ring-[#00B5D1] transition-all" placeholder="По батькові" onChange={e => setFormData({...formData, middleName: e.target.value})} />
              </div>
              
              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="w-full md:flex-1 space-y-2">
                  <label className="text-[10px] uppercase font-bold opacity-40 ml-4">Номер телефону</label>
                  <input 
                    type="tel"
                    className="w-full bg-white rounded-2xl p-5 shadow-sm outline-none focus:ring-2 focus:ring-[#00B5D1] font-mono tracking-widest text-lg transition-all" 
                    value={formData.phone} 
                    onChange={handlePhoneChange} 
                  />
                </div>
                
                <div className="w-full md:w-auto pb-4"> 
                  <label className="flex items-center gap-3 cursor-pointer group px-4 py-2">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="peer hidden" 
                        checked={formData.noCall} 
                        onChange={() => setFormData({...formData, noCall: !formData.noCall})} 
                      />
                      <div className="w-6 h-6 border-2 border-black/10 rounded-lg bg-white peer-checked:bg-gradient-to-r peer-checked:from-[#0B53A4] peer-checked:to-[#00B5D1] peer-checked:border-transparent transition-all flex items-center justify-center">
                        <Check size={14} className="text-white scale-0 peer-checked:scale-100 transition-transform" />
                      </div>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-tight opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Мені можна не телефонувати
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* ДОСТАВКА */}
            <section className="space-y-6">
              <div className="relative">
                <label className="text-[10px] uppercase font-bold opacity-40 ml-4">Місто доставки</label>
                <input 
                  className="w-full bg-white rounded-2xl p-5 mt-2 shadow-sm outline-none focus:ring-2 focus:ring-[#00B5D1] transition-all"
                  value={cityInput} placeholder="Почніть вводити назву..."
                  onFocus={() => setShowCities(true)}
                  onBlur={() => setTimeout(() => setShowCities(false), 200)}
                  onChange={e => setCityInput(e.target.value)}
                />
                {showCities && cities.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white shadow-2xl z-[70] rounded-2xl mt-1 max-h-60 overflow-y-auto border border-black/5">
                    {cities.map(c => (
                      <div key={c.Ref} className="p-4 hover:bg-gradient-to-r hover:from-[#0B53A4] hover:to-[#00B5D1] hover:text-white cursor-pointer text-sm transition-colors border-b border-black/5 last:border-0" 
                        onClick={() => { setSelectedCity({ref: c.Ref, name: c.Description}); setCityInput(c.Description); setShowCities(false); }}>
                        <span className="truncate block">{c.Description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {[
                  { id: 'warehouse', label: 'Відділення', icon: MapPin },
                  { id: 'postomat', label: 'Поштомат', icon: Box },
                  { id: 'courier', label: 'Кур\'єр', icon: Home },
                ].map((t) => (
                  <button key={t.id} type="button" onClick={() => { setDeliveryType(t.id as any); setPointInput(''); setSelectedPoint(''); }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${deliveryType === t.id ? 'border-transparent bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white' : 'border-transparent bg-white text-black opacity-40'}`}
                  >
                    <t.icon size={20} />
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-tighter">{t.label}</span>
                  </button>
                ))}
              </div>

              <div className="relative">
                <label className="text-[10px] uppercase font-bold opacity-40 ml-4">
                  {deliveryType === 'courier' ? 'Вулиця' : 'Оберіть точку видачі'}
                </label>
                <div className="relative">
                  <input disabled={!selectedCity.ref} className="w-full bg-white rounded-2xl p-5 mt-2 shadow-sm outline-none focus:ring-2 focus:ring-[#00B5D1] disabled:opacity-20 transition-all"
                    placeholder={!selectedCity.ref ? "Спочатку оберіть місто" : "Наприклад: Центральна..."}
                    value={pointInput}
                    onFocus={() => setShowPoints(true)}
                    onBlur={() => setTimeout(() => setShowPoints(false), 200)}
                    onChange={e => setPointInput(e.target.value)}
                  />
                  {isLoadingPoints && <Loader2 className="absolute right-5 top-7 animate-spin opacity-20" size={18} />}
                </div>
                {showPoints && deliveryPoints.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white shadow-2xl z-50 rounded-2xl mt-1 max-h-60 overflow-y-auto border border-black/5">
                    {deliveryPoints.map(p => (
                      <div key={p.Ref} className="p-4 hover:bg-gradient-to-r hover:from-[#0B53A4] hover:to-[#00B5D1] hover:text-white cursor-pointer text-sm border-b border-black/5 last:border-0"
                        onClick={() => { setSelectedPoint(p.Description || p.Present); setPointInput(p.Description || p.Present); setShowPoints(false); }}>
                        <span className="truncate block">{p.Description || p.Present}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {deliveryType === 'courier' && selectedPoint && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                  <input className="bg-white rounded-xl p-4 shadow-sm outline-none focus:ring-1 focus:ring-[#00B5D1]" placeholder="Буд." onChange={e => setCourierData({...courierData, house: e.target.value})} />
                  <input className="bg-white rounded-xl p-4 shadow-sm outline-none focus:ring-1 focus:ring-[#00B5D1]" placeholder="Кв." onChange={e => setCourierData({...courierData, apartment: e.target.value})} />
                  <input className="bg-white rounded-xl p-4 shadow-sm outline-none focus:ring-1 focus:ring-[#00B5D1]" placeholder="Під'їзд" onChange={e => setCourierData({...courierData, entrance: e.target.value})} />
                  <input className="bg-white rounded-xl p-4 shadow-sm outline-none focus:ring-1 focus:ring-[#00B5D1]" placeholder="Поверх" onChange={e => setCourierData({...courierData, floor: e.target.value})} />
                </div>
              )}
            </section>

            {/* ОПЛАТА ТА КОМЕНТАР */}
            <section className="space-y-6">
              <h4 className="text-[10px] uppercase font-bold opacity-40 ml-4">Спосіб оплати</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  type="button" 
                  onClick={() => setPaymentType('card')} 
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${paymentType === 'card' ? 'border-transparent bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white' : 'bg-white opacity-60'}`}
                >
                  <CreditCard size={20} />
                  <div className="text-left">
                    <span className="text-[10px] font-bold uppercase block">Оплата карткою</span>
                    <span className="text-[8px] uppercase opacity-50">Швидка оплата MyIBAN</span>
                  </div>
                </button>

                <button 
                  type="button" 
                  onClick={() => {
                     if (codConfig.enabled && paymentType !== 'cod') {
                       setShowCodWarning(true)
                     } else {
                       setPaymentType('cod')
                     }
                   }} 
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${paymentType === 'cod' ? 'border-transparent bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white' : 'bg-white opacity-60'}`}
                >
                  <Wallet size={20} />
                  <div className="text-left">
                    <span className="text-[10px] font-bold uppercase block">Накладний платіж</span>
                    <span className="text-[8px] uppercase opacity-50">При отриманні</span>
                  </div>
                </button>
              </div>
              
              <div className="space-y-2 pt-4">
                <label className="text-[10px] uppercase font-bold opacity-40 ml-4">Коментар до замовлення</label>
                <textarea 
                  rows={3} 
                  className="w-full bg-white rounded-2xl p-5 shadow-sm outline-none focus:ring-2 focus:ring-[#00B5D1] transition-all resize-none" 
                  placeholder="Напишіть ваші побажання..." 
                  onChange={e => setFormData({...formData, comment: e.target.value})} 
                />
              </div>

              <div className="lg:hidden pt-2">
                <div className="flex justify-between items-end mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Всього</span>
                    <span className="text-[9px] opacity-20 uppercase tracking-tighter">{paymentType === 'cod' ? '+ комісія пошти' : 'без комісії'}</span>
                  </div>
                  <span className="text-3xl font-black">{cartTotal} ₴</span>
                </div>
                <button 
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    !selectedPoint ||
                    formData.phone.length < 13 ||
                    !formData.firstName.trim() ||
                    !formData.lastName.trim()
                  }
                  className="w-full bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white py-6 rounded-2xl font-black uppercase text-[13px] hover:from-[#0c5db8] hover:to-[#00c5e3] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Замовити зараз"}
                </button>
              </div>
            </section>
          </div>

          <div className="sticky top-10 bg-gradient-to-b from-[#0B53A4] to-[#00B5D1] text-white rounded-[3rem] p-8 md:p-10 h-fit shadow-2xl">
            <h3 className="text-xl font-serif italic mb-8 opacity-60">Підсумок</h3>
            
            <div className="space-y-6 mb-10 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {cart.map(item => (
                <div key={item.id} className="flex gap-4 items-center group relative border-b border-white/5 pb-6 last:border-0">
                  {item.slug ? (
                    <Link href={`/product/${item.slug}`} className="w-20 h-20 bg-white/10 rounded-2xl overflow-hidden flex-shrink-0">
                      <img src={item.image || '/placeholder-product.jpg'} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ) : (
                    <div className="w-20 h-20 bg-white/10 rounded-2xl overflow-hidden flex-shrink-0">
                      <img src={item.image || '/placeholder-product.jpg'} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-between h-20">
                    <div className="flex justify-between items-start gap-2">
                      {item.slug ? (
                        <Link href={`/product/${item.slug}`} className="flex-1 min-w-0">
                          <span className="text-sm font-serif italic opacity-80 leading-tight line-clamp-2 hover:opacity-100 transition-opacity">{item.name}</span>
                        </Link>
                      ) : (
                        <span className="text-sm font-serif italic opacity-80 leading-tight line-clamp-2 flex-1 min-w-0">{item.name}</span>
                      )}
                      <button onClick={() => removeFromCart && removeFromCart(item.id)} className="opacity-20 hover:opacity-100 hover:text-red-400 transition-all p-1 flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-1 border border-white/10">
                        <button type="button" onClick={() => updateQuantity(item.id, -1)} className="text-lg opacity-40 hover:opacity-100 transition-opacity leading-none px-1">–</button>
                        <span className="text-[11px] font-mono font-bold w-4 text-center">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, 1)} className="text-lg opacity-40 hover:opacity-100 transition-opacity leading-none px-1">+</button>
                      </div>
                      <span className="font-bold text-sm whitespace-nowrap">{item.price * item.quantity} ₴</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-8 hidden lg:block">
              <div className="flex justify-between items-end mb-8">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Всього</span>
                  <span className="text-[9px] opacity-20 uppercase tracking-tighter">
                    {paymentType === 'cod' ? '+ комісія пошти' : 'без комісії'}
                  </span>
                </div>
                <span className="text-4xl font-black">{cartTotal} ₴</span>
              </div>
              
              <button 
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !selectedPoint ||
                  formData.phone.length < 13 ||
                  !formData.firstName.trim() ||
                  !formData.lastName.trim()
                }
                className="w-full bg-white text-black py-6 rounded-2xl font-black uppercase text-[11px] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-20"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Замовити зараз"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <CodWarningModal
        open={showCodWarning}
        title={codConfig.title}
        message={codConfig.message}
        okLabel={codConfig.okLabel}
        cancelLabel={codConfig.cancelLabel}
        onConfirm={() => {
          setPaymentType('cod')
          setShowCodWarning(false)
        }}
        onCancel={() => setShowCodWarning(false)}
      />
    </div>
  )
}
