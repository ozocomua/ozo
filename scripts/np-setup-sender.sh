#!/usr/bin/env bash
# Скрипт настройки отправителя НП — всё подтягивается автоматически
# Достаточно ввести название ФОП или Ref отправителя
set -e

API_KEY="8b46a9fb0e7c74d921df00a4dff9087b"
API_URL="https://api.novaposhta.ua/v2.0/json/"

echo "=== Налаштування відправника Нової Пошти ==="
echo ""
echo "Варіант 1: введи назву ФОП — знайду автоматично"
echo "Варіант 2: введи готовий Ref відправника одразу"
echo ""
read -p "Назва ФОП або Ref: " INPUT

# Определяем, Ref это или название
if [[ "$INPUT" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
  SENDER_REF="$INPUT"
else
  echo ""
  echo "Шукаю контрагента..."
  CP_RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"apiKey\": \"$API_KEY\",
      \"modelName\": \"Counterparty\",
      \"calledMethod\": \"getCounterparties\",
      \"methodProperties\": {
        \"FindByString\": \"$INPUT\",
        \"CounterpartyProperty\": \"Sender\",
        \"Limit\": \"10\"
      }
    }")

  echo ""
  echo "Знайдені:"
  echo "$CP_RESPONSE" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d.get('success') and d.get('data'):
    for i,cp in enumerate(d['data'][:10]):
        name = cp.get('Description','')
        edrpou = cp.get('EDRPOU','')
        ref = cp.get('Ref','')
        city_desc = cp.get('CityDescription','')
        print(f'  [{i}] {name}' + (f' (ЄДРПОУ: {edrpou})' if edrpou else '') + f'  Місто: {city_desc or \"—\"}')
        print(f'      Ref: {ref}')
else:
    print('Помилка:', d.get('errors', 'невідома'))
"
  echo ""
  read -p "Введи Ref вибраного: " SENDER_REF
fi

echo ""
echo "Підтягую дані автоматично..."

# Получаем детальную инфу о контрагенте
CP_INFO=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"apiKey\": \"$API_KEY\",
    \"modelName\": \"Counterparty\",
    \"calledMethod\": \"getCounterparties\",
    \"methodProperties\": {
      \"Ref\": \"$SENDER_REF\",
      \"CounterpartyProperty\": \"Sender\"
    }
  }")

CITY_REF=$(echo "$CP_INFO" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d.get('success') and d.get('data') and len(d['data'])>0:
    c = d['data'][0].get('City','')
    if c and c != '00000000-0000-0000-0000-000000000000':
        print(c)
")

CITY_NAME=$(echo "$CP_INFO" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d.get('success') and d.get('data') and len(d['data'])>0:
    print(d['data'][0].get('CityDescription',''))
")

# Адрес отправителя
ADDR_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"apiKey\": \"$API_KEY\",
    \"modelName\": \"Counterparty\",
    \"calledMethod\": \"getCounterpartyAddresses\",
    \"methodProperties\": {
      \"Ref\": \"$SENDER_REF\",
      \"CounterpartyProperty\": \"Sender\"
    }
  }")

echo ""
echo "Адреси відправника:"
echo "$ADDR_RESPONSE" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d.get('success') and d.get('data'):
    for i,a in enumerate(d['data'][:10]):
        desc = a.get('Description','')
        ref = a.get('Ref','')
        city_desc = a.get('CityDescription','')
        print(f'  [{i}] {city_desc}, {desc}  (Ref: {ref})')
else:
    print('Помилка:', d.get('errors', 'невідома'))
"

if [ -z "$CITY_REF" ]; then
  # Берём город из первого адреса
  CITY_REF=$(echo "$ADDR_RESPONSE" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d.get('success') and d.get('data') and len(d['data'])>0:
    city = d['data'][0].get('CityRef','')
    if city:
        print(city)
")
fi

echo ""
read -p "Введи Ref адреси відправника: " WAREHOUSE_REF

# Контакты
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
PHONE=$(echo "$CONTACTS_RESPONSE" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d.get('success') and d.get('data'):
    for i,p in enumerate(d['data'][:10]):
        name = p.get('Description','')
        phones = p.get('Phones','')
        ref = p.get('Ref','')
        print(f'  [{i}] {name}  тел: {phones}  Ref: {ref}')
    # автоподбор первого телефона
    if len(d['data'])>0:
        phones = d['data'][0].get('Phones','')
        if phones:
            print('__PHONE__:' + phones.replace(' ','').replace('-','').replace('(','').replace(')','').replace('+',''))
")

# Автоподбор телефона
AUTO_PHONE=$(echo "$PHONE" | grep '__PHONE__:' | head -1 | cut -d: -f2)
echo "$PHONE" | grep -v '__PHONE__:' || true

echo ""
read -p "Введи Ref контактної особи (Enter — перша): " CONTACT_REF

if [ -z "$CONTACT_REF" ]; then
  CONTACT_REF=$(echo "$CONTACTS_RESPONSE" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d.get('success') and d.get('data') and len(d['data'])>0:
    print(d['data'][0].get('Ref',''))
")
fi

if [ -n "$AUTO_PHONE" ]; then
  read -p "Телефон [$AUTO_PHONE]: " SENDER_PHONE
  SENDER_PHONE=${SENDER_PHONE:-$AUTO_PHONE}
else
  read -p "Телефон (напр. 380501234567): " SENDER_PHONE
fi

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
