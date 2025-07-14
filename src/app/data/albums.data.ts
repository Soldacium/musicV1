import { Albums } from '../models/music.interface';
import { environment } from '../../environments/environment';

export const albums: Albums = {
  circus: {
    albumName: 'Circus in the sky',
    albumCover: 'assets/images/circusInTheSky.jpg',
    albumArtist: 'Bliss n Eso',
    songs: [
      {
        name: 'Unite',
        duration: '2:40',
        path: `${environment.musicHost}/circus/01.mp3`,
      },
      {
        name: 'Pale blue dot',
        duration: '3:32',
        path: `${environment.musicHost}/circus/02.mp3`,
      },
      {
        name: 'I am somebody',
        duration: '5:10',
        path: `${environment.musicHost}/circus/03.mp3`,
      },
      {
        name: 'Home is where the heart is',
        duration: '3:30',
        path: `${environment.musicHost}/circus/04.mp3`,
      },
      {
        name: 'Animal kingdom',
        duration: '2:42',
        path: `${environment.musicHost}/circus/05.mp3`,
      },
      {
        name: `Can't get read of this feeling`,
        duration: '4:25',
        path: `${environment.musicHost}/circus/06.mp3`,
      },
      {
        name: 'Act your age',
        duration: '2:39',
        path: `${environment.musicHost}/circus/07.mp3`,
      },
      {
        name: `Life's midnight`,
        duration: '4:02',
        path: `${environment.musicHost}/circus/08.mp3`,
      },
      {
        name: 'Reservoir Dogs',
        duration: '4:13',
        path: `${environment.musicHost}/circus/09.mp3`,
      },
      {
        name: 'Next Frontier',
        duration: '2:24',
        path: `${environment.musicHost}/circus/10.mp3`,
      },
      {
        name: 'My life',
        duration: '3:37',
        path: `${environment.musicHost}/circus/11.mp3`,
      },
      {
        name: 'Jungle',
        duration: '3:02',
        path: `${environment.musicHost}/circus/12.mp3`,
      },
    ],
  },
  whereAreMyFriends: {
    albumName: 'Where are my friends',
    albumCover: 'assets/images/whereAreMyFriends.jpg',
    albumArtist: 'Abhi the nomad',
    songs: [
      {
        name: 'Hello Stranger',
        duration: '2:20',
        path: `${environment.musicHost}/where_are_my_friends/01.mp3`,
      },
      {
        name: 'Soul Safety Administration',
        duration: '2:49',
        path: `${environment.musicHost}/where_are_my_friends/02.mp3`,
      },
      {
        name: 'Calcutta',
        duration: '3:34',
        path: `${environment.musicHost}/where_are_my_friends/03.mp3`,
      },
      {
        name: 'Anti-Matter',
        duration: '2:58',
        path: `${environment.musicHost}/where_are_my_friends/04.mp3`,
      },
      {
        name: 'Download God',
        duration: '4:28',
        path: `${environment.musicHost}/where_are_my_friends/05.mp3`,
      },
      {
        name: 'Floors',
        duration: '3:30',
        path: `${environment.musicHost}/where_are_my_friends/06.mp3`,
      },
      {
        name: 'Yard Sale',
        duration: '3:20',
        path: `${environment.musicHost}/where_are_my_friends/07.mp3`,
      },
    ],
  },
};
