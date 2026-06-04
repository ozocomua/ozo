#!/usr/bin/env bash
# Скрипт для получения NP_SENDER_* переменных через API Новой Почты
# Ищет СУЩЕСТВУЮЩЕГО контрагента-отправителя (ФОП / компания)
# Город и контакты тянет из данных контрагента автоматически
set -e

API_KEY="8b46a9fb0e7c74d921df00a4dff9087b"
API_URL="https://api.novaposhta.ua/v2.0/json/"

echo "=== Пошук існуючого контрагента-відправника ==="
read -p "Назва ФОП / компанії (як у кабінеті НП): " SENDER_NAME

CP_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"apiKey\": \"$API_KEY\",
    \"modelName\": \"Counterparty\",
    \"calledMethod\": \"getCounterparties\",
    \"methodProperties\": {
      \"FindByString\": \"$SENDER_NAME\",
      \"CounterpartyProperty\": \"Sender\",
      \"Limit\": \"10\"
    }
  }")

echo ""
echo "Знайдені контрагенти-відправники:"
echo "$CP_RESPONSE" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d.get('success') and d.get('data'):
    for i,cp in enumerate(d['data'][:10]):
        name = cp.get('Description','')
        edrpou = cp.get('EDRPOU','')
        ref = cp.get('Ref','')
        city = cp.get('City','')
        city_desc = cp.get('CityDescription','')
        print(f\"  [{i}] {name}\" + (f\" (ЄДРПОУ: {edrpou})\" if edrpou else '') + f\"  Місто: {city_desc}  Ref: {ref}\")
else:
    print('Помилка:', d.get('errors', 'невідома'))
"

echo ""
read -p "Введи Ref вибраного контрагента: " SENDER_REF

# Извлекаем город контрагента из ответа
CITY_REF=$(echo "$CP_RESPONSE" | python3 -c "
import json,sys
d=json.load(sys.stdin)
ref='$SENDER_REF'
if d.get('success') and d.get('data'):
    for cp in d['data']:
        if cp.get('Ref') == ref:
            print(cp.get('City',''))
            break
")

if [ -z "$CITY_REF" ]; then
  echo "Не вдалося визначити місто контрагента."
  exit 1
fi

echo ""
echo "Місто контрагента: $CITY_REF"
echo ""

echo "=== Пошук відділення ==="
read -p "Номер або адреса відділення (напр. '1'): " WAREHOUSE_QUERY

WH_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"apiKey\": \"$API_KEY\",
    \"modelName\": \"Address\",
    \"calledMethod\": \"getWarehouses\",
    \"methodProperties\": {
      \"CityRef\": \"$CITY_REF\",
      \"FindByString\": \"$WAREHOUSE_QUERY\",
      \"Limit\": \"10\"
    }
  }")

echo ""
echo "Знайдені відділення:"
echo "$WH_RESPONSE" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d.get('success') and d.get('data'):
    for i,w in enumerate(d['data'][:10]):
        print(f\"  [{i}] {w['Description']}  (Ref: {w['Ref']})\")
else:
    print('Помилка:', d.get('errors', 'невідома'))
"

echo ""
read -p "Введи Ref вибраного відділення: " WAREHOUSE_REF

echo ""
echo "=== Отримання контактних осіб ==="

CONTACTS_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"apiKey\": \"$API_KEY\",
    \"modelName\": \"Counterparty\",
    \"calledMethod\": \"getCounterpartyContactPersons\",
    \"methodProperties\": {
      \"Ref\": \"$SENDER_REF\",
      \"Page\": \"1\"
    }
  }")

echo ""
echo "Контактні особи:"
echo "$CONTACTS_RESPONSE" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d.get('success') and d.get('data'):
    for i,p in enumerate(d['data'][:10]):
        name = p.get('Description','')
        phones = p.get('Phones','')
        ref = p.get('Ref','')
        print(f\"  [{i}] {name}  тел: {phones}  Ref: {ref}\")
else:
    print('Помилка:', d.get('errors', 'невідома'))
"

echo ""
read -p "Введи Ref контактної особи (або Enter якщо не потрібно): " CONTACT_REF

echo ""
echo "=== Телефон відправника ==="
read -p "Телефон (напр. 380501234567): " SENDER_PHONE

echo ""
echo "===================================="
echo " ДОДАЙ ЦЕ В .env на сервері:"
echo "===================================="
echo "NP_SENDER_REF=$SENDER_REF"
echo "NP_SENDER_CITY_REF=$CITY_REF"
echo "NP_SENDER_ADDRESS_REF=$WAREHOUSE_REF"
echo "NP_SENDER_CONTACT_REF=$CONTACT_REF"
echo "NP_SENDER_PHONE=$SENDER_PHONE"
echo "===================================="
