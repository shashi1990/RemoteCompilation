import os
import sys

x = str(sys.argv[1])

os.mkdir(sys.argv[1])

if not os.path.exists('file'):
    open(x +'/in.txt', 'w').close()

if not os.path.exists('file'):
    open(x +'/out.txt', 'w').close()