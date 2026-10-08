import os
from tqdm import tqdm

data_dir = 'dressing-in-order/data'
test_dir = os.path.join(data_dir, 'test')

if not os.path.exists(test_dir):
    os.makedirs(test_dir)

target_fns = [fn[:-4] for fn in os.listdir(os.path.join(data_dir, 'testM_lip'))]

for fn in tqdm(os.listdir(os.path.join(data_dir, 'images'))):
    elements = fn.split("-")
    elements[2] = elements[2].replace("_", "")
    last_elements = elements[-1].split("_")
    elements[-1] = last_elements[0] + "_" + last_elements[1] + last_elements[2]
    new_fn = "fashion" + "".join(elements)
    
    if new_fn[:-4] in target_fns:
        src = os.path.join(data_dir, 'images', fn)
        dst = os.path.join(test_dir, new_fn)
        if os.path.exists(src) and not os.path.exists(dst):
            os.rename(src, dst)

print("Data processing complete!")
