import json
import yaml

ips = []

with open('ip_list.json', 'r') as file:
    data = json.load(file)
    
    for val in data.values():
        ips.append(val['value'])
        
    inventory = {
        'web_servers' : {
            'hosts' : ips
        }
    }
    
with open('inventory.yml', 'w') as file:
    yaml.dump(inventory, file)
