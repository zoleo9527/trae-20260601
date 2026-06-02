import type { User } from '../types';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: '李老师',
    role: 'teacher',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=温柔的女老师头像&image_size=square',
    password: '123456',
  },
  {
    id: 'user-2',
    name: '王园长',
    role: 'principal',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=和蔼的女园长头像&image_size=square',
    password: '123456',
  },
];

export const findUserByCredentials = (name: string, password: string): User | undefined => {
  return mockUsers.find(user => user.name === name && user.password === password);
};
