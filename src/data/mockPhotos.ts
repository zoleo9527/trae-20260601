import type { Photo } from '../types';

export const mockPhotos: Photo[] = [
  {
    id: 'photo-1',
    childId: 'child-1',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=幼儿园小朋友在玩积木&image_size=square',
    caption: '小宝在玩积木',
    timestamp: '2026-06-02T09:30:00+08:00',
  },
  {
    id: 'photo-2',
    childId: 'child-1',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=幼儿园小朋友在看书&image_size=square',
    caption: '小宝在看书',
    timestamp: '2026-06-02T10:15:00+08:00',
  },
  {
    id: 'photo-3',
    childId: 'child-2',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=小女孩在画画&image_size=square',
    caption: '妞妞在画画',
    timestamp: '2026-06-02T09:45:00+08:00',
  },
  {
    id: 'photo-4',
    childId: 'child-3',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=小男孩在玩汽车玩具&image_size=square',
    caption: '浩浩在玩汽车',
    timestamp: '2026-06-02T10:00:00+08:00',
  },
  {
    id: 'photo-5',
    childId: 'child-3',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=幼儿园小朋友户外活动&image_size=square',
    caption: '浩浩在户外活动',
    timestamp: '2026-06-02T15:30:00+08:00',
  },
  {
    id: 'photo-6',
    childId: 'child-4',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=小孩膝盖轻微擦伤伤口特写&image_size=square',
    caption: '膝盖轻微擦伤',
    timestamp: '2026-06-02T16:00:00+08:00',
  },
  {
    id: 'photo-7',
    childId: 'child-5',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=小女孩在玩过家家&image_size=square',
    caption: '朵朵在玩过家家',
    timestamp: '2026-06-02T10:30:00+08:00',
  },
  {
    id: 'photo-8',
    childId: 'child-5',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=幼儿园小朋友做手工&image_size=square',
    caption: '朵朵做的手工',
    timestamp: '2026-06-02T14:30:00+08:00',
  },
  {
    id: 'photo-9',
    childId: 'child-6',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=小男孩在玩皮球&image_size=square',
    caption: '阳阳在拍皮球',
    timestamp: '2026-06-02T15:00:00+08:00',
  },
  {
    id: 'photo-10',
    childId: 'child-7',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=小女孩在唱歌&image_size=square',
    caption: '萌萌在唱歌',
    timestamp: '2026-06-02T11:00:00+08:00',
  },
  {
    id: 'photo-11',
    childId: 'child-7',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=幼儿园小朋友和老师互动&image_size=square',
    caption: '萌萌和老师做游戏',
    timestamp: '2026-06-02T11:30:00+08:00',
  },
  {
    id: 'photo-12',
    childId: 'child-8',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=小男孩在搭积木&image_size=square',
    caption: '天天在搭积木',
    timestamp: '2026-06-02T09:15:00+08:00',
  },
];

export const getPhotosByChildId = (childId: string): Photo[] => {
  return mockPhotos.filter(photo => photo.childId === childId);
};

export const getPhotoById = (id: string): Photo | undefined => {
  return mockPhotos.find(photo => photo.id === id);
};
