#!/usr/bin/env bash
if [ -z "$TOKEN" ]; then
    printf 'Please set $TOKEN before running the script'
    exit 1
fi

curl 'https://discord.com/api/v9/users/@me/relationships' -H "authorization: $TOKEN" --compressed --silent > relationships.json # my friends
printf "{\n"
while IFS=\n read id; do
    printf "\"%s\": [%s],\n" "$id" $(curl "https://discord.com/api/v9/users/$id/relationships" -H "authorization: $TOKEN"  --compressed --silent | jq -r '[.[].id] | @csv') # mutual friends
    sleep 1
done < <(cat relationships.json | jq '.[].id' -r)
printf "}\n"
