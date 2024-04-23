# static_loader.py
# responsible for loading static files into a dictionary for use in the project
# this was done because of the requirement that we needed to be able to use chrome's file:// protocol
# which does not allow for loading files from the local file system
# also, I didn't want to have to use AWS S3 or something like that to host the files, especially since
# I don't know whether testing will be conducted with an internet connection or not

# CONFIG
STATIC_DIR = '././static'
PATH_PREFIX = './static'
OUTPUT = 'engine/static.js'
DICT_NAME = 'g_static'
ALLOWED_FILE_TYPES = ['.glsl', '.obj']

# Go through the static directory and load all files into a dictionary
# Such that the file name is the key and the file contents is the value
# All allowed file types are human readible, so just write them as strings

import os
import json

def load_static():
    static = {}
    # walk through the static directory
    for root, dirs, files in os.walk(STATIC_DIR):
        for file in files:
            # get the file name and extension
            name, ext = os.path.splitext(file)
            # check if the file type is allowed
            if ext in ALLOWED_FILE_TYPES:
                # get the file path
                path = os.path.join(root, file)
                # open the file and read the contents
                with open(path, 'r') as f:
                    contents = f.read()
                
                # get the entire file path relative to the static directory
                # this is used as the key in the dictionary
                dir_path = os.path.dirname(path)
                rel_path = PATH_PREFIX + "/" + os.path.relpath(dir_path, STATIC_DIR)
                key = os.path.join(rel_path, file)
                # replace backslashes with forward slashes
                key = key.replace('\\', '/')
                print("Loading static file: {}".format(key))
                # add the file to the dictionary
                static[key] = contents

    return static

def write_static(static):
    with open(OUTPUT, 'w') as f:
        f.write('var {} = '.format(DICT_NAME))
        json.dump(static, f, indent=4)
        f.write(';')

if __name__ == '__main__':
    static = load_static()
    write_static(static)