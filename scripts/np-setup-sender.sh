#!/usr/bin/env bash
# Скрипт для получения NP_SENDER_* переменных через API Новой Почты
# Замени ТВОЙ_ГОРОД ниже на название города отправки (uk)
set -e

API_KEY="8b46a9fb0e7c74d921df00a4dff9087b"
API_URL="https://api.novaposhta.ua/v2.0/json/"

echo "=== Пошук міста ==="
read -p "Місто відправника (uk): " CITY_NAME

CITY_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"apiKey\": \"$API_KEY\",
    \"modelName\": \"Address\",
    \"calledMethod\": \"getCities\",
    \"methodProperties\": {
      \"FindByString\": \"$CITY_NAME\",
      \"Limit\": \"5\"
    }
  }")

echo ""
echo "Знайдені міста:"
echo "$CITY_RESPONSE" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d.get('success') and d.get('data'):
    for i,c in enumerate(d['data'][:5]):
        print(f\"  [{i}] {c['Description']}  (Ref: {c['Ref']})\")
else:
    print('Помилка:', d.get('errors', 'невідома'))
"

echo ""
read -p "Введи Ref вибраного міста: " CITY_REF

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
echo "=== Створення контрагента-відправника ==="
read -p "Назва компанії / ПІБ відправника: " SENDER_NAME
read -p "Телефон відправника (напр. 380501234567): " SENDER_PHONE

PARTS=($SENDER_NAME)
LAST_NAME="${PARTS[0]}"
FIRST_NAME="${PARTS[1]:-}"
MIDDLE_NAME="${PARTS[*]:2}"

CP_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"apiKey\": \"$API_KEY\",
    \"modelName\": \"Counterparty\",
    \"calledMethod\": \"save\",
    \"methodProperties\": {
      \"FirstName\": \"$FIRST_NAME\",
      \"MiddleName\": \"$MIDDLE_NAME\",
      \"LastName\": \"$LAST_NAME\",
      \"Phone\": \"$SENDER_PHONE\",
      \"CounterpartyType\": \"PrivatePerson\",
      \"CounterpartyProperty\": \"Sender\"
    }
  }")

SENDER_REF=$(echo "$CP_RESPONSE" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d.get('success') and d.get('data') and len(d['data'])>0:
    print(d['data'][0]['Ref'])
else:
    print('ERROR')
")

CONTACT_REF=$(echo "$CP_RESPONSE" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d.get('success') and d.get('data') and len(d['data'])>0:
    contacts = d['data'][0].get('ContactPerson',{}).get('data',[])
    if contacts:
        print(contacts[0]['Ref'])
    else:
        print('')
else:
    print('')
")

if [ "$SENDER_REF" = "ERROR" ] || [ -z "$SENDER_REF" ]; then
  echo "Помилка створення контрагента:"
  echo "$CP_RESPONSE"
  exit 1
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
