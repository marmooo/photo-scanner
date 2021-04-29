from adabound import AdaBound
# from keras.applications import MobileNetV2
# from keras_efficientnets import EfficientNetB0
# import efficientunet
import autoencoder

import os, sys, glob, random, math
import numpy as np
import matplotlib.pyplot as plt
import cv2
from keras.utils import Sequence
from keras.datasets import mnist
from keras.layers import Input, Dense, Conv2D, MaxPooling2D, UpSampling2D, GlobalAveragePooling2D
from keras.models import Model, load_model
from keras import backend as K
from keras.callbacks import EarlyStopping
from keras.preprocessing.image import load_img, save_img, img_to_array, array_to_img


IMG_SIZE = 256
BATCH_SIZE = 4

def mish(x):
    return x * K.tanh(K.softplus(x))

def swish(x):
    return x * K.sigmoid(x)

def relu1(x):
    return K.relu(x, max_value=1)



# 出力画像を台形＋背景変換して x_train/x_test を生成
# y_train/y_test は台形の頂点データ
class AffineSequence(Sequence):
    def __init__(self, filepaths, length, output=False):
        self.filepaths = filepaths
        self.length = length
        self.output = output

    def __getitem__(self, idx):
        filepath = self.filepaths[idx]
        print(filepath)
        img = cv2.imread(filepath)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32)  # Pillow Format
        x = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
        # x, y = conv(img, self.output, 0)
        return x.reshape((1, IMG_SIZE, IMG_SIZE, 3)) / 255

    def __len__(self):
        return self.length

    def on_epoch_end(self):
        pass

class DenoiseSequence(Sequence):
    def __init__(self, train_filepaths, test_filepaths, length, output=False):
        self.train_filepaths = train_filepaths
        self.test_filepaths = test_filepaths
        self.length = length
        self.output = output
        self.shape = (1, IMG_SIZE, IMG_SIZE, 3)

    def __getitem__(self, idx):
        train_filepath = self.train_filepaths[idx]
        img_train = cv2.imread(train_filepath)
        img_train = cv2.cvtColor(img_train, cv2.COLOR_BGR2RGB).astype(np.float32)  # Pillow Format
        x = cv2.resize(img_train, (IMG_SIZE, IMG_SIZE))
        test_filepath = self.test_filepaths[idx]
        img_test = cv2.imread(test_filepath)
        img_test = cv2.cvtColor(img_test, cv2.COLOR_BGR2RGB).astype(np.float32)  # Pillow Format
        y = cv2.resize(img_test, (IMG_SIZE, IMG_SIZE))
        y -= x
        return x.reshape(self.shape) / 255, y.reshape(self.shape) / 255

    def __len__(self):
        return self.length

    def on_epoch_end(self):
        pass

class CheckSequence(Sequence):
    def __init__(self, filepaths, length):
        self.filepaths = filepaths
        self.length = length
        self.shape = (1, IMG_SIZE, IMG_SIZE, 3)

    def __getitem__(self, idx):
        filepath = self.filepaths[idx]
        img = cv2.imread(filepath)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32)  # Pillow Format
        x = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
        return x.reshape(self.shape) / 255

    def __len__(self):
        return self.length

    def on_epoch_end(self):
        pass

def conv(img, output=False, i=0):
    # 台形変換
    h, w, c = img.shape
    x1 = random.random() * w / 4
    y1 = random.random() * h / 4
    x2 = random.random() * w / 4
    y2 = (random.random() + 3) * h / 4
    x3 = (random.random() + 3) * w / 4
    y3 = (random.random() + 3) * h / 4
    x4 = (random.random() + 3) * w / 4
    y4 = random.random() * h / 4
    # r = random.randint(0, 255)
    # g = random.randint(0, 255)
    # b = random.randint(0, 255)
    r, g, b = 0, 0, 0  # TODO: 黒紙対応 (紙面の平均色の補色, etc.)
    src = np.array([[0, 0], [0, h], [w, h], [w, 0]], dtype=np.float32)
    dst = np.array([[x1, y1], [x2, y2], [x3, y3], [x4, y4]], dtype=np.float32)
    points = np.array([x1/w, y1/h, x2/w, y2/h, x3/w, y3/h, x4/w, y4/h])
    mat = cv2.getPerspectiveTransform(src, dst)
    affine_img = cv2.warpPerspective(img, mat, (w, h), borderValue=(r, g, b))
    # # 回転移動
    # angle = random.randint(-20, 20)
    # scale = (random.random() + 3) /4
    # mat = cv2.getRotationMatrix2D((w // 2, h // 2), angle, scale)
    # anc = math.cos(angle)
    # ans = math.sin(angle)
    # points = np.array([
    #     points[0] * anc - points[1] * ans,
    #     points[0] * anc + points[1] * ans,
    #     points[2] * anc - points[3] * ans,
    #     points[2] * anc + points[3] * ans,
    #     points[4] * anc - points[5] * ans,
    #     points[4] * anc + points[5] * ans,
    #     points[6] * anc - points[7] * ans,
    #     points[6] * anc + points[7] * ans,
    #     ])
    # affine_img = cv2.warpAffine(img, mat, (w, h))
    affine_img = cv2.resize(affine_img, (IMG_SIZE, IMG_SIZE))
    if output == True:
        filepath = 'check-train/' + str(i) + '.jpg'
        cv2.imwrite(filepath, affine_img)
    return affine_img, points

def generate_test_data(filepaths, points):
    for i, filepath in enumerate(filepaths):
        dirs = filepath.split('/')
        base_filepath = dirs[0] + '/base/'  + dirs[2] + '/0.jpg'  # ex: train-denoise/base/aaa/0.jpg
        img = cv2.imread(base_filepath)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32)  # Pillow Format
        h, w, c = img.shape
        r, g, b = 0, 0, 0
        src = np.array([[0, 0], [0, h], [w, h], [w, 0]], dtype=np.float32)
        print(points)  # TODO: ノイズに弱い
        dst = points[i].reshape(4, 2)
        dst[:,0] *= w
        dst[:,1] *= h
        mat = cv2.getPerspectiveTransform(src, dst)
        affine_img = cv2.warpPerspective(img, mat, (w, h), borderValue=(r, g, b))
        newdir = dirs[0] + '/denoised/' + dirs[2]
        filename = os.path.basename(filepath)
        os.makedirs(newdir, exist_ok=True)
        cv2.imwrite(newdir + '/' + filename, affine_img)
        print(newdir + '/' + filename)



# affiner = load_model('affine.model', custom_objects={'AdaBound':AdaBound, 'mish':mish})
# input_shape = (IMG_SIZE, IMG_SIZE, 3)
#
# train_filepaths = glob.glob('train-denoise/original/**/*.JPG')
# points = affiner.predict_generator(
#         AffineSequence(train_filepaths, len(train_filepaths), output=False)) / 100
# generate_test_data(train_filepaths, points)
#
# test_filepaths = glob.glob('test-denoise/original/**/*.JPG')
# points = affiner.predict_generator(
#         AffineSequence(test_filepaths, len(test_filepaths), output=False)) / 100
# generate_test_data(test_filepaths, points)



train1_filepaths = glob.glob('train-denoise/original/*.jpg')
train2_filepaths = glob.glob('train-denoise/denoised/*.jpg')
train_list = DenoiseSequence(train1_filepaths, train2_filepaths, len(train1_filepaths), output=False)
test1_filepaths = glob.glob('test-denoise/original/*.jpg')
test2_filepaths = glob.glob('test-denoise/denoised/*.jpg')
test_list = DenoiseSequence(test1_filepaths, test2_filepaths, len(test2_filepaths), output=False)
print(len(train1_filepaths), len(train2_filepaths), len(test1_filepaths), len(test2_filepaths))
#
# for idx in range(0, len(train1_filepaths)):
#     train_filepath = train1_filepaths[idx]
#     img_train = cv2.imread(train_filepath)
#     img_train = cv2.cvtColor(img_train, cv2.COLOR_BGR2RGB).astype(np.float32)  # Pillow Format
#     x = cv2.resize(img_train, (IMG_SIZE, IMG_SIZE))
#     test_filepath = train2_filepaths[idx]
#     img_test = cv2.imread(test_filepath)
#     img_test = cv2.cvtColor(img_test, cv2.COLOR_BGR2RGB).astype(np.float32)  # Pillow Format
#     y = cv2.resize(img_test, (IMG_SIZE, IMG_SIZE))
#     y -= x
#     cv2.imwrite('check-denoise-1/' + str(idx) + '.jpg', y)
# sys.exit()



# unfortunaly efficientunet_b0 is too large (163MB) ...
# model = efficientunet.get_efficient_unet_b0(
#         # (IMG_SIZE, IMG_SIZE, 3), out_channels=3, concat_input=False)
#         (IMG_SIZE, IMG_SIZE, 3), out_channels=3, concat_input=False)
model = autoencoder.autoencoder((IMG_SIZE, IMG_SIZE, 3))
# model.compile(optimizer=AdaBound(amsbound=True), loss='binary_crossentropy')
# model.compile(optimizer=AdaBound(amsbound=True, learning_rate=1e-4), loss='binary_crossentropy')
model.compile(optimizer=AdaBound(amsbound=True, learning_rate=1e-4), loss='mse')
# model.summary()
early_stopping = EarlyStopping(patience=10, verbose=1)
model.fit_generator(
        train_list, steps_per_epoch=len(train1_filepaths),
        validation_data=test_list, validation_steps=len(test1_filepaths),
        epochs=100, callbacks=[early_stopping])
model.save('denoise.model', overwrite=True)



# train-denoise に写真で撮ったデータ、test-denoise にスキャンしたデータ
# 学習した後に差分を取る
test1_filepaths = glob.glob('test-denoise/original/*.jpg')
# affiner = load_model('affine.model', custom_objects={'AdaBound':AdaBound, 'mish':mish})
denoiser = load_model('denoise.model', custom_objects={'AdaBound':AdaBound})
check_list = CheckSequence(test1_filepaths, len(test1_filepaths))
denoised_list = denoiser.predict_generator(check_list)
for i, denoised in enumerate(denoised_list):
    print(i, test1_filepaths[i])
    img = cv2.imread(test1_filepaths[i])
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32)  # Pillow Format
    src = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
    h, w, c = img.shape
    denoised = cv2.resize(denoised * 255, (w, h))
    cv2.imwrite('check-denoise-1/' + str(i) + '.jpg', img + denoised)

