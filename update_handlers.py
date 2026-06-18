with open('src/mock/handlers.ts', 'r') as f:
    content = f.read()

patterns = [
    {
        'start': "router.post('/api/orders/:id/measure'",
        'has_return': True,
    },
    {
        'start': "router.post('/api/orders/:id/appointment')",
        'has_return': True,
    },
    {
        'start': "router.put('/api/orders/:id/appointment')",
        'has_return': True,
    },
    {
        'start': "router.post('/api/orders/:id/schedule')",
        'has_return': True,
    },
    {
        'start': "router.put('/api/orders/:id/schedule/reassign')",
        'has_return': True,
    },
    {
        'start': "router.post('/api/orders/:id/start-installation')",
        'has_return': True,
    },
    {
        'start': "router.post('/api/orders/:id/return')",
        'has_return': True,
    },
    {
        'start': "router.post('/api/orders/:id/handle-return')",
        'has_return': True,
    },
    {
        'start': "router.post('/api/orders/:id/supplement')",
        'has_return': True,
    },
    {
        'start': "router.post('/api/orders/:id/supplement/:supplementId/fulfill')",
        'has_return': True,
    },
    {
        'start': "router.post('/api/orders/:id/supplement/:supplementId/receive')",
        'has_return': True,
    },
    {
        'start': "router.post('/api/orders/:id/complete')",
        'has_return': True,
    },
    {
        'start': "router.post('/api/orders/:id/archive')",
        'has_return': True,
    },
    {
        'start': "router.post('/api/orders/:id/remind')",
        'has_return': True,
    },
    {
        'start': "router.post('/api/orders/:id/remark')",
        'has_return': True,
    },
]

def find_handler_end(lines, start_idx):
    """Find the line index of the closing }); of a router handler"""
    depth = 0
    for i in range(start_idx, len(lines)):
        line = lines[i]
        depth += line.count('{') - line.count('}')
        if depth == 0 and '});' in line:
            return i
    return -1

lines = content.split('\n')
applied = 0

# Process in reverse order so line indices don't shift
for pattern in reversed(patterns):
    start_pattern = pattern['start']
    for i, line in enumerate(lines):
        if start_pattern in line:
            end_idx = find_handler_end(lines, i)
            if end_idx == -1:
                print(f"WARNING: Could not find end for {start_pattern}")
                break
            
            handler_lines = lines[i:end_idx+1]
            handler_text = '\n'.join(handler_lines)
            
            has_get_order_detail = 'getOrderDetail' in handler_text
            
            if not has_get_order_detail:
                indent = '  '
                
                new_handler_lines = []
                for j, hline in enumerate(handler_lines):
                    if 'return ' in hline and 'orderService.' in hline and 'getOrderDetail' not in hline:
                        new_line = hline.replace('return ', '')
                        new_handler_lines.append(new_line)
                    elif hline.strip() == '});':
                        new_handler_lines.append(f'{indent}  return orderService.getOrderDetail(params.id);')
                        new_handler_lines.append(hline)
                    else:
                        new_handler_lines.append(hline)
                
                lines[i:end_idx+1] = new_handler_lines
                applied += 1
            
            break

with open('src/mock/handlers.ts', 'w') as f:
    f.write('\n'.join(lines))

print(f"Applied {applied} replacements")
