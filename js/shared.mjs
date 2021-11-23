'use strict';

/** Class representing an artist. */
export class Artist {
  /**
   * Create an artist object.
   * @param {string} id ID of the artist.
   * @param {string} name Name of the artist.
   * @param {string | null} twitter Twitter handler.
   * @param {string | null} youtube YouTube channel ID.
   * @param {number | null} bilibili Bilibili user ID.
   */
  constructor({ id, name, twitter=null, youtube=null, bilibili=null } = {}) {
    this.id = id;
    this.name = name;
    this.twitter = twitter;
    this.youtube = youtube;
    this.bilibili = bilibili;
  }
}

/** Class representing a Hanayori member. */
export class HanayoriMember extends Artist {
  /**
   * Create a Hanayori member object.
   * @param {string} id ID of the member.
   * @param {string} name Name of the member.
   * @param {string | null} twitter Twitter handler.
   * @param {string | null} youtube YouTube channel ID.
   * @param {number | null} bilibili Bilibili user ID.
   * @param {string | null} fanbox pixivFANBOX ID.
   * @param {string | null} booth pixiv BOOTH ID.
   * @param {string | null} nameWithRubyStyling Japanese Name with Furiganas.
   * @param {Object | null} resources Resources, including images, etc.
   * @param {Object | null} profile Profile, including names in other languages, birthday, etc.
   */
  constructor({ id, name, twitter=null, youtube=null, bilibili=null, fanbox=null, booth=null, nameWithRubyStyling=null, resources=null, profile=null } = {}) {
    super({ id, name, twitter, youtube, bilibili });
    this.fanbox = fanbox;
    this.booth = booth;
    this.nameWithRubyStyling = nameWithRubyStyling;
    this.resources = resources;
    this.profile = profile;
  }
}

export const LANGUAGE = new Map([
  ['en', 'English'],
  ['ja', '日本語'],
  ['zh', '中文'],
  ['undefined', '未知']
]);

export const ARTISTS = new Map([
  ['kano', new HanayoriMember({
    id: 'kano',
    name: '鹿乃',
    nameWithRubyStyling: '<ruby><rb>鹿</rb><rt>か</rt><rb>乃</rb><rt>の</rt></ruby>',
    twitter: 'Kanolive_',
    youtube: 'UCfuz6xYbYFGsWWBi3SpJI1w',
    bilibili: 316381099,
    booth: 'kanomahoro',
    resources: {
      avatar: 'images/avatar_kano.jpg',
      avatarNew: 'images/avatar_kano_current.jpg',
      banner: 'images/banner_kano.jpg',
      color: '#ea9a94'
    },
    profile: {
      nameCN: '鹿乃',
      nameEN: 'Kano',
      class: 3,
      birthday: '12月24日',
      height: 145,
      mark: '🌼🎄',
      identity: '<a href="https://kano-official.amebaownd.com/" target="_blank">鹿乃</a>',
      redebut: '<a href="https://twitter.com/kanomahoro" target="_blank">鹿乃まほろ</a>'
    }
  })],
  ['nonono', new HanayoriMember({
    id: 'nonono',
    name: '野々宮ののの',
    nameWithRubyStyling: '<ruby><rb>野々</rb><rt>のの</rt><rb>宮</rb><rt>みや</rt></ruby>ののの',
    twitter: 'nonomiyanonono',
    youtube: 'UCiexEBp7-D46FXUtQ-BpgWg',
    bilibili: 441403698,
    resources: {
      avatar: 'images/avatar_nonono.jpg',
      avatarNew: 'images/avatar_nonono.jpg',
      banner: 'images/banner_nonono.jpg',
      color: '#70d8f0'
    },
    profile: {
      nameCN: '野野宮ののの',
      nameEN: 'Nonomiya Nonono',
      class: 2,
      birthday: '2月9日',
      height: 155,
      mark: '🌼🍖',
      identity: '<a href="https://twitter.com/hiina_ntn" target="_blank">柊南</a>'
    }
  })],
  ['hareru', new HanayoriMember({
    id: 'hareru',
    name: '花丸はれる',
    nameWithRubyStyling: '<ruby><rb>花</rb><rt>はな</rt><rb>丸</rb><rt>まる</rt></ruby>はれる',
    twitter: 'hanamaruhareru',
    youtube: 'UCyIcOCH-VWaRKH9IkR8hz7Q',
    bilibili: 441381282,
    fanbox: 'hanamaruhareru',
    booth: 'hanamaruhareru',
    resources: {
      avatar: 'images/avatar_hareru.jpg',
      avatarNew: 'images/avatar_hareru_current.jpg',
      banner: 'images/banner_hareru.jpg',
      color: '#ffca46'
    },
    profile: {
      nameCN: '花丸晴琉',
      nameEN: 'Hanamaru Hareru',
      class: 1,
      birthday: '3月20日',
      height: 154,
      mark: '🌼☀',
      identity: '<a href="https://twitter.com/mirinndawa" target="_blank">+*みりん</a>, <a href="https://twitter.com/harerudaze" target="_blank">はれる</a>'
    }
  })],
  ['hitona', new HanayoriMember({
    id: 'hitona',
    name: '小東ひとな',
    nameWithRubyStyling: '<ruby><rb>小</rb><rt>こ</rt><rb>東</rb><rt>ひがし</rt></ruby>ひとな',
    twitter: 'kohigashihitona',
    youtube: 'UCV2m2UifDGr3ebjSnDv5rUA',
    bilibili: 441382432,
    fanbox: 'kohigashihitona',
    booth: '1107-official',
    resources: {
      avatar: 'images/avatar_hitona.jpg',
      avatarNew: 'images/avatar_hitona_current.jpg',
      banner: 'images/banner_hitona.jpg',
      color: '#9ce376'
    },
    profile: {
      nameCN: '小东人魚',
      nameEN: 'Kohigashi Hitona',
      class: 1,
      birthday: '5月4日',
      height: 156,
      mark: '🌼🐟',
      identity: '<a href="https://twitter.com/amm091" target="_blank">大西あみみ</a>'
    }
  })],
  ['kagura-mea', new Artist({
    id: 'kagura-mea',
    name: '神楽めあ',
    twitter: 'KaguraMea_VoV',
    youtube: 'UCWCc8tO-uUl_7SJXIKJACMw',
    bilibili: 349991143
  })],
  ['kagura-nana', new Artist({
    id: 'kagura-nana',
    name: 'カグラナナ',
    twitter: 'nana_kaguraaa',
    youtubeShort: 'かぐらななななかぐ辛党Ch',
    bilibili: 386900246
  })],
  ['mononobe-alice', new Artist({
    id: 'mononobe-alice',
    name: '物述有栖',
    twitter: 'alicemononobe',
    youtube: 'UCt0clH12Xk1-Ej5PXKGfdPA',
    bilibili: 434565011
  })],
  ['natsuiro-matsuri', new Artist({
    id: 'natsuiro-matsuri',
    name: '夏色まつり',
    twitter: 'natsuiromatsuri',
    youtube: 'UCQ0UDLQCjY0rmuxCDE38FGg',
    bilibili: 336731767
  })],
  ['quon-tama', new Artist({
    id: 'quon-tama',
    name: '久遠たま',
    twitter: 'quon01tama',
    youtubeShort: 'QuonTama'
  })],
  ['ruki', new Artist({
    id: 'ruki',
    name: '琉绮Ruki',
    bilibili: 420249427
  })],
  ['shirakami-fubuki', new Artist({
    id: 'shirakami-fubuki',
    name: '白上フブキ',
    twitter: 'shirakamifubuki',
    youtube: 'UCdn5BQ06XqgXoAxIhbqw5Rg',
    bilibili: 332704117
  })],
  ['suzuka-stella', new Artist({
    id: 'suzuka-stella',
    name: '鈴花ステラ',
    twitter: '_suzukastella',
    youtube: 'UChAOCCFuF2hto05Z68xp56A'
  })],
  ['yousa', new Artist({
    id: 'yousa',
    name: '泠鸢yousa',
    bilibili: 282994
  })]
]);
export const HANAYORI_MEMBER_IDS = ['kano', 'nonono', 'hareru', 'hitona'];

/**
 * For some Bilibili live collection playlists, newest clip always comes as p1.
 * This constant records how many pages are there in those playlists so that 
 * negative page numbers can be used in JSON files.
 */
export const BILIBILI_PLAYLIST_PAGES = new Map([
  ['BV1jE411X7hH', 91],  // Hareru
  ['BV1PE411R7w2', 59]   // Hitona
]);
