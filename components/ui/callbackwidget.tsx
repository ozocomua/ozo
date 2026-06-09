"use client"

import { useState, useEffect } from "react"
import { Phone, X, Loader2, Check } from "lucide-react"
import { toast } from "sonner"

export default function CallbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [formData, setFormData] = useState({
    name: '',
    phone: '+380',
    email: '',
    comment: ''
  })

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-callback', handleOpen);
    return () => window.removeEventListener('open-callback', handleOpen);
  }, []);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return '+380';
    let formatted = '+380';
    if (numbers.length > 3) formatted += ' (' + numbers.substring(3, 5);
    if (numbers.length > 5) formatted += ') ' + numbers.substring(5, 8);
    if (numbers.length > 8) formatted += '-' + numbers.substring(8, 10);
    if (numbers.length > 10) formatted += '-' + numbers.substring(10, 12);
    return formatted;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const res = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          comment: formData.comment,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Помилка відправки")
        setStatus('idle')
        return
      }

      setStatus('success');
      setFormData({ name: '', phone: '+380', email: '', comment: '' });
      toast.success("Заявку прийнято, менеджер зателефонує!");

      setTimeout(() => {
        setIsOpen(false);
        setStatus('idle');
      }, 3500);
    } catch {
      toast.error("Помилка мережі, спробуйте ще раз")
      setStatus('idle')
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Зворотній зв'язок"
        className="w-14 h-14 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group"
      >
        {isOpen ? <X size={24} /> : <Phone size={24} className="group-hover:rotate-12 transition-transform" />}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[90vw] md:w-[350px] bg-white rounded-[2.5rem] shadow-2xl border border-black/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-8">
            {status === 'success' ? (
              <div className="py-10 text-center space-y-4 animate-in zoom-in duration-500">
                <div className="w-16 h-16 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white rounded-full flex items-center justify-center mx-auto">
                  <Check size={30} />
                </div>
                <h3 className="text-xl font-serif italic text-black">Дякуємо!</h3>
                <p className="text-[11px] sm:text-xs opacity-60 leading-relaxed uppercase font-bold tracking-tighter text-black">
                  Заявка прийнята. Ми зателефонуємо вам найближчим часом.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-serif italic text-black">Допомога</h3>
                  <p className="text-[11px] sm:text-xs uppercase font-bold opacity-30 tracking-widest text-black">Зворотний зв'язок</p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold opacity-40 ml-4 text-black">Ім'я *</label>
                    <input
                      required
                      autoComplete="name"
                      className="w-full bg-[#F9F9F7] rounded-2xl p-4 text-base text-foreground outline-none focus:ring-2 focus:ring-[#00B5D1] transition-all"
                      placeholder="Як до вас звертатися?"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold opacity-40 ml-4 text-black">Телефон *</label>
                    <input
                      required
                      type="tel"
                      autoComplete="tel"
                      className="w-full bg-[#F9F9F7] rounded-2xl p-4 text-base font-mono text-black outline-none focus:ring-2 focus:ring-[#00B5D1] transition-all"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: formatPhoneNumber(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold opacity-40 ml-4 text-black">Email (опціонально)</label>
                    <input
                      type="email"
                      autoComplete="email"
                      className="w-full bg-[#F9F9F7] rounded-2xl p-4 text-base text-black outline-none focus:ring-2 focus:ring-[#00B5D1] transition-all"
                      placeholder="Для відповіді поштою"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold opacity-40 ml-4 text-black">Ваше питання</label>
                    <textarea
                      rows={2}
                      className="w-full bg-[#F9F9F7] rounded-2xl p-4 text-base text-black outline-none focus:ring-2 focus:ring-[#00B5D1] transition-all resize-none"
                      placeholder="Що вас цікавить?"
                      value={formData.comment}
                      onChange={e => setFormData({...formData, comment: e.target.value})}
                    />
                  </div>
                </div>

                <button
                  disabled={status === 'submitting' || formData.phone.length < 19 || !formData.name}
                  className="w-full bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white py-5 rounded-2xl font-black uppercase text-[11px] sm:text-xs tracking-widest hover:from-[#0c5db8] hover:to-[#00c5e3] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {status === 'submitting' ? <Loader2 className="animate-spin" size={16} /> : "Чекаю на дзвінок"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
