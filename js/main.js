'use strict';

import { Artist, HanayoriMember, ARTISTS, BILIBILI_PLAYLIST_PAGES, HANAYORI_MEMBER_IDS, LANGUAGE } from './shared.mjs';

/** Class representing a video source. */
class Source {
  /**
   * Instantiate a source object.
   * @param {string} id ID of the source.
   */
  constructor(id) {
    this.id = id;
  }

  /**
   * Generate a single URL query parameter string which can be appended to a URL.
   * @param {boolean} isFirstParameter Whether this is the first parameter in the URL.
   * @param {string} key Key of the parameter.
   * @param {string} value Value of the parameter.
   * @return {string} A URL query parameter string like "&t=0". 
   */
  appendUrlParameter(isFirstParameter, key, value) {
    const query = (isFirstParameter.val ? '?' : '&') + key + '=' + value;
    isFirstParameter.val = false;
    return query;
  }
}

/** Class representing an Apple Music audio source. */
class AppleMusicSource extends Source {
  /**
   * Instantiate an Apple Music source object.
   * @param {number} id Track ID of the source.
   * @param {number} a Album ID of the source.
   * @param {string | null} storefront Two-character country code: https://developer.apple.com/documentation/applemusicapi/get_a_catalog_song/.
   */
  constructor({ id, a, storefront=null } = {}) {
    super(id);
    this.albumId = a;
    this.storefront = storefront && storefront.match(/^[a-z]{2}$/) ? storefront : null;
  }

  /**
   * Get the URL of the source.
   * @return {string} Source URL.
   */
  get url() {
    return this.storefront
        ? `https://music.apple.com/${this.storefront}/album/${this.albumId}?i=${this.id}`
        : `https://music.apple.com/album/${this.albumId}?i=${this.id}`;
  }

  /**
   * Get the URL of the source in the embedded iframe player.
   * @return {string} URL of the source in the embedded iframe player.
   */
  get embedUrl() {
    return this.storefront
        ? `https://embed.music.apple.com/${this.storefront}/album/${this.albumId}?i=${this.id}`
        : `https://embed.music.apple.com/us/album/${this.albumId}?i=${this.id}`;
  }
}

/** Class representing a Bilibili video source. */
class BilibiliSource extends Source {
  /**
   * Instantiate a Bilibili source object.
   * @param {string} id BVID of the source.
   * @param {number} t Start time of the source, in second.
   * @param {number} p Page of the source (for videos with multiple pages).
   */
  constructor({ id, t=0, p=0 } = {}) {
    super(id);
    this.t = t;
    this.p = p;
  }

  /**
   * Generate a Bilibili URL.
   * @param {string} url Bilbili base URL.
   * @param {Object} isFirstParameter Whether this is the first parameter in the URL.
   * @param {string} pKey Key of the page parameter.
   * @param {string} tKey Key of the start time parameter.
   * @return {string} A full Bilibili URL. 
   */
  buildUrl(url, isFirstParameter, pKey, tKey) {
    if (Number.isInteger(this.p)) {  // Append page parameter
      if (this.p > 0) {
        url += this.appendUrlParameter(isFirstParameter, pKey, this.p);
      } else if (this.p < 0 && BILIBILI_PLAYLIST_PAGES.has(this.id)) {  // For some Bilibili live collections, newest clip always comes as p1
        const totalPages = BILIBILI_PLAYLIST_PAGES.get(this.id);
        if (Number.isInteger(totalPages) && totalPages > 0) {
          url += this.appendUrlParameter(isFirstParameter, pKey, totalPages + this.p + 1);
        }
      }
    }
    if (Number.isInteger(this.t) && this.t > 0) {  // Append start time parameter
      url += this.appendUrlParameter(isFirstParameter, tKey, this.t);
    }
    return url;
  }

  /**
   * Get the URL of the source.
   * @return {string} Source URL.
   */
  get url() {
    let url = `https://www.bilibili.com/video/${this.id}`;
    let isFirstParameter = { val: true };
    return this.buildUrl(url, isFirstParameter, 'p', 't');
  }

  /**
   * Get the URL of the source in the embedded iframe player.
   * @return {string} URL of the source in the embedded iframe player.
   */
  get embedUrl() {
    let url = `https://player.bilibili.com/player.html?autoplay=1&high_quality=1&bvid=${this.id}`;
    let isFirstParameter = { val: false };
    return this.buildUrl(url, isFirstParameter, 'page', 't');
  }

  /**
   * Get the direct URL of the audio source.
   * @return {string} Direct URL of the audio source.
   */
  get audioDirectUrl() {
    if (this.t !== 0) {
      return null;
    }
    let p = this.p === 0 ? 1 : this.p;
    return `https://1420723207941484.us-west-1.fc.aliyuncs.com/2016-08-15/proxy/bilibili/extractor/?audioOnly=1&bvid=${this.id}&p=${p}`;
  }
}

/** Class representing a Niconico video source. */
class NiconicoSource extends Source {
  /**
   * Instantiate a Niconico source object.
   * @param {string} id ID of the source.
   */
  constructor({ id } = {}) {
    super(id);
  }

  /**
   * Get the URL of the source.
   * @return {string} Source URL.
   */
  get url() {
    return `https://nico.ms/${this.id}`;
  }

  /**
   * Get the URL of the source in the embedded iframe player.
   * @return {string} URL of the source in the embedded iframe player.
   */
  get embedUrl() {
    return `https://embed.nicovideo.jp/watch/${this.id}`;
  }
}

/** Class representing a Spotify audio source. */
class SpotifySource extends Source {
  /**
   * Instantiate a Spotify source object.
   * Track relinking: https://developer.spotify.com/documentation/general/guides/track-relinking-guide/
   * @param {string} id Track ID of the source.
   * @param {string | null} market Two-character country code: https://developer.spotify.com/console/get-track/.
   */
  constructor({ id, market=null } = {}) {
    super(id);
    this.market = market && market.match(/^[a-z]{2}$/) ? market : null;
  }

  /**
   * Get the URL of the source.
   * @return {string} Source URL.
   */
  get url() {
    return `https://open.spotify.com/track/${this.id}`;
  }

  /**
   * Get the URL of the source in the embedded iframe player.
   * @return {string} URL of the source in the embedded iframe player.
   */
  get embedUrl() {
    return `https://open.spotify.com/embed/track/${this.id}`;
  }
}

/** Class representing a YouTube video source. */
class YouTubeSource extends Source {
  /**
   * Instantiate a YouTube source object.
   * @param {string} id ID of the source.
   * @param {number} t Start time of the source, in second.
   */
  constructor({ id, t=0 } = {}) {
    super(id);
    this.t = t;
  }

  /**
   * Get the URL of the source.
   * @return {string} Source URL.
   */
  get url() {
    let url = `https://youtu.be/${this.id}`;
    if (Number.isInteger(this.t) && this.t > 0) {
      url += `?t=${this.t}`;
    }
    return url;
  }

  /**
   * Get the URL of the source in the embedded iframe player.
   * @return {string} URL of the source in the embedded iframe player.
   */
  get embedUrl() {
    let url = `https://youtube.com/watch?v=${this.id}`;
    if (Number.isInteger(this.t) && this.t > 0) {
      url += `&start=${this.t}`;
    }
    return url;
  }
}

/** Class representing a song. */
class Song {
  /**
   * Instantiate a Song object.
   * @param {string} name Name of the song.
   * @param {string} language ISO 639-1 language code of the song.
   * @param {Object[] | null} clips Clips, which can be BilibiliSource objects, YouTubeSource objects, Date objects or just strings.
   * @param {string[] | null} otherArtists IDs of the collaborators of the song.
   * @param {string | null} notes Notes.
   */
  constructor({ name, language, clips=null, otherArtists=null, notes=null } = {}) {
    this.name = name;
    this.language = language;
    this.clips = null;
    this.otherArtists = null;
    this.notes = notes;

    if (Array.isArray(clips)) {
      this.clips = [];
      for (const clip of clips) {
        let source = new Map();
        for (const [key, value] of Object.entries(clip)) {
          if (key === 'date') {
            source.set(key, new Date(value));
          } else if (key.includes('youtube')) {
            source.set(key, new YouTubeSource(value));
          } else if (key.includes('bilibili')) {
            source.set(key, new BilibiliSource(value));
          } else {
            source.set(key, value);
          }
        }
        this.clips.push(source);
      }
    }

    if (otherArtists) {
      this.otherArtists = [];
      for (const artistId of otherArtists) {
        const artist = ARTISTS.get(artistId);
        if (ARTISTS.has(artistId) && artist.id && artist.name) {
          this.otherArtists.push(artist);
        } else {
          this.otherArtists.push(artistId);
        }
      }
    }
  }
}

/** Class representing a version of an original track song. */
class OriginalTrackSongVersion {
  /**
   * Instantiate an original track song version object.
   * @param {string | null} date Release date of the song in the ISO 8601 format (YYYY-MM-DD).
   * @param {string} language ISO 639-1 language code of the song.
   * @param {string[]} artists Artists of the song.
   * @param {Object[] | null} clips Clips, which can be BilibiliSource objects, Niconico objects, YouTubeSource objects, or just strings.
   * @param {string | null} altName Alternative name of the song.
   */
  constructor({ date=null, language, artists, clips=null, altName=null } = {}) {
    this.date = new Date(date);
    this.language = language;
    this.artists = artists;
    this.clips = null;
    this.altName = altName;

    if (Array.isArray(clips)) {
      this.clips = [];
      for (const clip of clips) {
        let source = new Map();
        for (const [key, value] of Object.entries(clip)) {
          if (key.includes('youtube')) {
            source.set(key, new YouTubeSource(value));
          } else if (key.includes('niconico')) {
            source.set(key, new NiconicoSource(value));
          } else if (key.includes('bilibili')) {
            source.set(key, new BilibiliSource(value));
          } else if (key.includes('spotify')) {
            source.set(key, new SpotifySource(value));
          } else if (key.includes('apple')) {
            source.set(key, new AppleMusicSource(value));
          } else {
            source.set(key, value);
          }
        }
        this.clips.push(source);
      }
    }
  }
}

/** Class representing an original track song. */
class OriginalTrackSong {
  /**
   * Instantiate an original track song object.
   * @param {string} name Name of the song.
   * @param {string[] | null} producers Producers of the song (only for Vocalaid songs).
   * @param {string[] | null} original Indicate whether it is Hanayori Joshiryou member's original song.
   * @param {Object[] | null} versions Versions of the song.
   */
  constructor({ name, producers=null, original=null, versions=null } = {}) {
    this.name = name;
    this.producers = producers;
    this.original = original;
    this.versions = null;
  
    if (Array.isArray(versions)) {
      this.versions = [];
      for (const version of versions) {
        this.versions.push(new OriginalTrackSongVersion(version));
      }
    }
  }
}

/*
// Icon fonts: https://www.iconfont.cn/user/detail?uid=5455300
const BILIBILI_ICON = '<svg width="1.3em" height="1.3em" version="1.1" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#icon-bilibili" /></svg>';
const NICONICO_ICON = '<svg width="1em" height="1em" version="1.1" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#icon-niconico" /></svg>';
const YOUTUBE_ICON = '<svg width="1.3em" height="1.3em" version="1.1" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#icon-youtube" /></svg>';
*/
// Other constants
const ORIGINAL_TRACK_SONGS_FILENAME = 'original';
const SECTIONS = ['pv', 'special', 'live'];
// Global variables for APlayer
let aplayer = null;
let aplayerPvPlaylist = [];
let aplayerLiveCutoutPlaylist = [];
let aplayerCurrentPlaylistSection = SECTIONS[0];
let shouldResumeAplayer = false;

// Get query strings from URL: https://stackoverflow.com/a/2880929
let urlParams = {};
(window.onpopstate = () => {
  let match;
  const pl = /\+/g;  // Regex for replacing addition symbol with a space
  const search = /([^&=]+)=?([^&]*)/g;
  const decode = (s) => decodeURIComponent(s.replace(pl, ' '));
  const query = window.location.search.substring(1);

  while (match = search.exec(query)) {
    if (decode(match[1]) in urlParams) {
      if (!Array.isArray(urlParams[decode(match[1])])) {
        urlParams[decode(match[1])] = [urlParams[decode(match[1])]];
      }
      urlParams[decode(match[1])].push(decode(match[2]));
    } else {
      urlParams[decode(match[1])] = decode(match[2]);
    }
  }
})();

/**
 * Wrapper of jQuery.getJSON() method.
 * @async
 * @function getJSON
 * @param {string} filename JSON file name, without extension, under data directory.
 * @return {JSON} A JSON object.
 */
const getJSON = async (filename) => {
  return $.getJSON(`data/${filename}.json`).fail(() => {
    console.error('An error has occurred.');
  });
};

/**
 * Process a JSON object of a member.
 * @function processMemberJSON
 * @param {JSON} json A JSON object.
 * @return {Song[][]} A 2-dimensional array of Song objects.
 */
const processMemberJSON = (json) => {
  let jsonSections = [json.pv, json.special, json.live];
  let songSections = [[], [], []];
  for (let i = 0; i < jsonSections.length; i++) {
    if (Array.isArray(jsonSections[i])) {
      for (const jsonSong of jsonSections[i]) {
        songSections[i].push(new Song(jsonSong));
      }
    }
  }
  return songSections;
};

/**
 * Process the JSON object of all original track songs.
 * @function processOriginalTrackSongsJSON
 * @param {JSON} json A JSON object.
 * @return {Map<string, OriginalTrackSong>} A map of all original track songs indexed by names.
 */
const processOriginalTrackSongsJSON = (json) => {
  let originalTrackSongsMap = new Map();
  for (const jsonOriginalTrackSong of json) {
    let originalTrackSong = new OriginalTrackSong(jsonOriginalTrackSong);
    originalTrackSongsMap.set(originalTrackSong.name, originalTrackSong);
  }
  return originalTrackSongsMap;
}

/**
 * Render song collection page.
 * @function renderPage
 * @param {string} memberId A member ID.
 */
const renderPage = (memberId) => {
  const member = ARTISTS.get(memberId);
  $(document).attr('title', `${member.name} | 花寄女子寮 歌アーカイブ`);
  $('header.banner').css('background-image', `url('${member.resources.banner}')`);
  $('aside img.avatar').attr('src', member.resources.avatar);
  $('aside #member-name').html(member.nameWithRubyStyling);
  $('#sidebar-icon-twitter').attr('href', `https://twitter.com/${member.twitter}`);
  $('#sidebar-icon-youtube').attr('href', `https://youtube.com/channel/${member.youtube}`);
  $('#sidebar-icon-youtube2').remove();
  $('#sidebar-icon-bilibili').attr('href', `https://space.bilibili.com/${member.bilibili}`);
  if (member.fanbox) {
    $('#sidebar-icon-fanbox').attr('href', `https://${member.fanbox}.fanbox.cc/`);
  } else {
    $('#sidebar-icon-fanbox').remove();
  }
  if (member.booth) {
    $('#sidebar-icon-booth').attr('href', `https://${member.booth}.booth.pm/`);
  } else {
    $('#sidebar-icon-booth').remove();
  }
  $('#sidebar-name-cn').text(member.profile.nameCN);
  $('#sidebar-name-en').text(member.profile.nameEN);
  $('#sidebar-class').text(member.profile.class);
  $('#sidebar-birthday').text(member.profile.birthday);
  $('#sidebar-height').text(member.profile.height);
  $('#sidebar-mark').text(member.profile.mark);
  $('#sidebar-identity').text(member.profile.identity);
  $('.sidebar-hide').removeClass('sidebar-hide d-none');
  if (memberId === 'kano') {
    $('#sidebar-profile').append(`<li>中の人 ${member.profile.identity}</li>`);
    $('#sidebar-profile').append(`<li>転生 ${member.profile.redebut}</li>`);
  }
  $('#home-container').remove();
  $('#songs-container').removeClass('d-none');
  $('#back-to-home-arrow').removeClass('d-none');
};

/**
 * Render song section.
 * @function renderSection
 * @param {string} section A section ID.
 * @param {string} memberId A member ID.
 * @param {Song[]} songs An array of Song objects.
 */
const renderSection = (section, memberId, songs, originalTrackSongs) => {
  const member = ARTISTS.get(memberId);
  if (songs && songs.length) {
    $(`#${section}-section table tbody`).empty();
    $(`#${section}-section h5 .songs-count`).text(` (${songs.length})`);
    for (const song of songs) {
      const language = LANGUAGE.has(song.language) ? LANGUAGE.get(song.language) : LANGUAGE.get('undefined');
      let songNameHtml = song.name;
      // Build HTML for collaborators
      let otherArtistsHtml = '';
      let otherArtistsPlainText = '';
      if (Array.isArray(song.otherArtists)) {
        for (let i = 0; i < song.otherArtists.length; i++) {
          const otherArtist = song.otherArtists[i];
          if (otherArtist instanceof HanayoriMember) {
            otherArtistsHtml += `<a href="./?v=${otherArtist.id}">${otherArtist.name}</a>`;
            otherArtistsPlainText += otherArtist.name;
          } else if (otherArtist instanceof Artist) {
            otherArtistsHtml += otherArtist.name;
            otherArtistsPlainText += otherArtist.name;
          } else {
            otherArtistsHtml += otherArtist;
            otherArtistsPlainText += otherArtist;
          }
          if (i < song.otherArtists.length - 1) {
            otherArtistsHtml += '・';
            otherArtistsPlainText += ', ';
          }
        }
      }
      if (otherArtistsHtml) {
        songNameHtml += `<br><span class="other-artists">With ${otherArtistsHtml}</span>`;
      }

      // Build HTML for original track song if existed
      let originalTrackSongsHtml = '';
      const originalTrackSongIndexKey = song.name;
      if (originalTrackSongs.has(originalTrackSongIndexKey)) {
        const originalTrackSong = originalTrackSongs.get(originalTrackSongIndexKey);
        if (originalTrackSong.original && Array.isArray(originalTrackSong.original) && originalTrackSong.original.includes(memberId)) {
          originalTrackSongsHtml = 'オリジナル曲';
        } else {
          if (Array.isArray(originalTrackSong.versions)) {
            let originalTrackSongVersionsHtmlList = [];
            for (const originalTrackSongVersion of originalTrackSong.versions) {
              let originalTrackSongVersionHtml = "";
              if (originalTrackSong.producers && Array.isArray(originalTrackSong.producers) && originalTrackSong.producers.length) {
                originalTrackSongVersionHtml = originalTrackSong.producers.join('・') + " / ";
              }
              originalTrackSongVersionHtml += originalTrackSongVersion.artists.join('・');
              for (const [_, source] of originalTrackSongVersion.clips[0]) {
                if (source instanceof YouTubeSource) {
                  // originalTrackSongVersionHtml += `&nbsp;<a href="${source.url}" class="icon-youtube" data-lity data-lity-target="${source.embedUrl}">${YOUTUBE_ICON}</a>`;
                  originalTrackSongVersionHtml += `&nbsp;<a href="${source.url}" class="icon-youtube" data-lity data-lity-target="${source.embedUrl}"><i class="fab fa-youtube"></i></a>`;
                } else if (source instanceof NiconicoSource) {
                  // originalTrackSongVersionHtml += `&nbsp;<a href="${source.url}" class="icon-niconico" data-lity data-lity-target="${source.embedUrl}">${NICONICO_ICON}</a>`;
                  originalTrackSongVersionHtml += `&nbsp;<a href="${source.url}" class="icon-niconico" data-lity data-lity-target="${source.embedUrl}"><i class="fas fa-tv-retro"></i></a>`;
                } else if (source instanceof BilibiliSource) {
                  // originalTrackSongVersionHtml += `&nbsp;<a href="${source.url}" class="icon-bilibili" data-lity data-lity-target="${source.embedUrl}">${BILIBILI_ICON}</a>`;
                  originalTrackSongVersionHtml += `&nbsp;<a href="${source.url}" class="icon-bilibili" data-lity data-lity-target="${source.embedUrl}"><i class="fab fa-bilibili"></i></a>`;
                } else if (source instanceof SpotifySource) {
                  originalTrackSongVersionHtml += `&nbsp;<a href="${source.url}" class="icon-spotify" data-lity data-lity-target="${source.embedUrl}"><i class="fab fa-spotify"></i></a>`;
                } else if (source instanceof AppleMusicSource) {
                  originalTrackSongVersionHtml += `&nbsp;<a href="${source.url}" class="icon-apple-music" data-lity data-lity-target="${source.embedUrl}"><i class="fab fa-apple"></i></a>`;
                }
              }
              originalTrackSongVersionsHtmlList.push(originalTrackSongVersionHtml);
            }
            originalTrackSongsHtml = originalTrackSongVersionsHtmlList.join('<br>');
          }
        }
      }

      if (section === 'pv' || section === 'special') {
        // Build HTML for sources
        let sourceHtml = '';
        if (Array.isArray(song.clips) && song.clips.length === 1) {
          for (const [key, source] of song.clips[0]) {
            let extraAttrs = '';
            let extraClasses = '';
            if (source instanceof Source) {
              if (key.includes('Unavailable')) {
                extraAttrs += ' onclick="return false;"';
                extraClasses += ' icon-unavailable';
              } else {
                extraAttrs += ` data-lity data-lity-target="${source.embedUrl}"`;
              }
            }
            if (source instanceof YouTubeSource) {
              // sourceHtml += (sourceHtml ? '&nbsp;' : '') + `<a href="${source.url}" class="icon-youtube${extraClasses}"${extraAttrs}>${YOUTUBE_ICON}</a>`;
              sourceHtml += (sourceHtml ? '&nbsp;' : '') + `<a href="${source.url}" class="icon-youtube${extraClasses}"${extraAttrs}><i class="fab fa-youtube"></i></a>`;
            } else if (source instanceof BilibiliSource) {
              // sourceHtml += (sourceHtml ? '&nbsp;' : '') + `<a href="${source.url}" class="icon-bilibili${extraClasses}"${extraAttrs}>${BILIBILI_ICON}</a>`;
              sourceHtml += (sourceHtml ? '&nbsp;' : '') + `<a href="${source.url}" class="icon-bilibili${extraClasses}"${extraAttrs}><i class="fab fa-bilibili"></i></a>`;
              // Add song to APlayer's playlist
              if (section === 'pv' && !key.includes('Unavailable') && source.audioDirectUrl) {
                aplayerPvPlaylist.push({
                  name: song.name,
                  artist: member.name + (otherArtistsPlainText ? ', ' + otherArtistsPlainText : ''),
                  url: source.audioDirectUrl,
                  cover: member.resources.avatarNew
                });
              }
            }
          }
        }
        // Build table for PV or Special section
        if (section === 'pv') {
          $(`#${section}-section table tbody`).append(`<tr>                    
              <td>${songNameHtml}</td>
              <td>${language}</td>
              <td>${sourceHtml}</td>
              <td>${originalTrackSongsHtml}</td>
            </tr>`);
        } else {
          $(`#${section}-section table tbody`).append(`<tr>                    
              <td>${songNameHtml}</td>
              <td>${language}</td>
              <td>${sourceHtml}</td>
              <td>${originalTrackSongsHtml}</td>
              <td>${song.notes ? song.notes : ''}</td>
            </tr>`);
        }

      } else if (section === 'live') {
        let clips = [];
        if (Array.isArray(song.clips) && song.clips.length) {
          let hasAddedToPlaylist = false;
          for (const clip of song.clips) {
            let excludedFromPlaylist = clip.has('excluded') ? clip.get('excluded') === true : false
            // Build HTML for date and sources
            let streamSourceHtml = '';
            let cutoutSourceHtml = '';
            for (const [key, source] of clip) {
              let extraAttrs = '';
              let extraClasses = '';
              if (source instanceof Source) {
                if (key.includes('Unavailable')) {
                  extraAttrs += ' onclick="return false;"';
                  extraClasses += ' icon-unavailable';
                } else {
                  extraAttrs += ` data-lity data-lity-target="${source.embedUrl}"`;
                }
              }
              if (source instanceof YouTubeSource) {
                // streamSourceHtml += (streamSourceHtml ? '&nbsp;' : '') + `<a href="${source.url}" class="icon-youtube${extraClasses}"${extraAttrs}>${YOUTUBE_ICON}</a>`;
                streamSourceHtml += (streamSourceHtml ? '&nbsp;' : '') + `<a href="${source.url}" class="icon-youtube${extraClasses}"${extraAttrs}><i class="fab fa-youtube"></i></a>`;
              } else if (source instanceof BilibiliSource) {
                if (key.includes('Cutout')) {
                  if (key.includes('CutoutO')) {
                    extraAttrs += ' title="公式アカウント"';
                  } else if (key.includes('CutoutU')) {
                    extraAttrs += ' title="非公式アカウント"';
                  }
                  // cutoutSourceHtml += (cutoutSourceHtml ? '&nbsp;' : '') + `<a href="${source.url}" data-toggle="tooltip" class="icon-bilibili${extraClasses}"${extraAttrs}>${BILIBILI_ICON}</a>`;
                  cutoutSourceHtml += (cutoutSourceHtml ? '&nbsp;' : '') + `<a href="${source.url}" data-toggle="tooltip" class="icon-bilibili${extraClasses}"${extraAttrs}><i class="fab fa-bilibili"></i></a>`;
                  // Add song to APlayer's playlist
                  if (!hasAddedToPlaylist && !excludedFromPlaylist && !key.includes('Unavailable') && source.audioDirectUrl) {
                    aplayerLiveCutoutPlaylist.push({
                      name: song.name,
                      artist: member.name + (otherArtistsPlainText ? ', ' + otherArtistsPlainText : ''),
                      url: source.audioDirectUrl,
                      cover: member.resources.avatarNew
                    });
                    hasAddedToPlaylist = true;
                  }
                } else {
                  let tooltipTitle = '';
                  if (key.includes('O')) {
                    tooltipTitle += '公式アカウント';
                  } else if (key.includes('U')) {
                    tooltipTitle += '非公式アカウント';
                  }
                  if (key.includes('C')) {
                    tooltipTitle += ' 中国語字幕付き';
                  } else if (key.includes('R')) {
                    tooltipTitle += ' 字幕なし';
                  }
                  if (tooltipTitle) {
                    extraAttrs += ` title="${tooltipTitle}"`;
                  }
                  // streamSourceHtml += (streamSourceHtml ? '&nbsp;' : '') + `<a href="${source.url}" data-toggle="tooltip" class="icon-bilibili${extraClasses}"${extraAttrs}>${BILIBILI_ICON}</a>`;
                  streamSourceHtml += (streamSourceHtml ? '&nbsp;' : '') + `<a href="${source.url}" data-toggle="tooltip" class="icon-bilibili${extraClasses}"${extraAttrs}><i class="fab fa-bilibili"></i></a>`;
                }
              }
            }
            clips.push({
              'date': clip.get('date').toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                timeZone: 'Asia/Tokyo'
              }),
              'streamSources': streamSourceHtml,
              'cutoutSources': cutoutSourceHtml,
              'notes': clip.has('notes') ? clip.get('notes') : ''
            });
          }
        }
        // Build table for Live section
        for (let i = 0; i < clips.length; i++) {
          if (i === 0) {  // First row of the table with possible merged cells
            const extraAttrs = clips.length === 1 ? '' : ` rowspan="${clips.length}"`;
            $(`#${section}-section table tbody`).append(`<tr>                    
                <td${extraAttrs}>${songNameHtml}</td>
                <td${extraAttrs}>${language}</td>
                <td>${clips[i].date}</td>
                <td>${clips[i].streamSources}</td>
                <td>${clips[i].cutoutSources}</td>
                <td${extraAttrs}>${originalTrackSongsHtml}</td>
                <td>${clips[i].notes}</td>
              </tr>`);
          } else {  // Other rows
            $(`#${section}-section table tbody`).append(`<tr>
                <td>${clips[i].date}</td>
                <td>${clips[i].streamSources}</td>
                <td>${clips[i].cutoutSources}</td>
                <td>${clips[i].notes}</td>
              </tr>`);
          }
        }
      }
    }
  } else {
    $(`#${section}-section`).remove();
  }
};

/**
 * Render homepage.
 * @function renderHomepage
 */
const renderHomepage = () => {
  $('#sidebar-icon-bilibili').remove();
  $('#sidebar-icon-youtube2').removeClass('d-none');
  $('#sidebar-icon-youtube2').addClass('d-inline-block');
  $('#back-to-home-arrow').remove();
  $('#home-container .row').empty();
  for (const memberId of HANAYORI_MEMBER_IDS) {
    const member = ARTISTS.get(memberId);
    let homeContainerHtml = `<div class="col-6 col-md-3 mb-2">
        <a href="./?v=${memberId}">
          <img alt="Avatar of ${member.profile.nameEN}" class="avatar rounded-circle" src="${member.resources.avatar}" />
        </a>
        <h4 class="text-center mt-2">${member.nameWithRubyStyling}</h4>
        <div class="text-center">
          <a id="sidebar-icon-twitter" href="https://twitter.com/${member.twitter}" target="_blank" class="d-inline-block icon-twitter">
            <i class="fab fa-twitter fa-fw fa-lg"></i>
            <!-- <svg width="1.5em" height="1.5em" version="1.1" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#icon-twitter" /></svg> -->
          </a>
          <a id="sidebar-icon-youtube" href="https://youtube.com/channel/${member.youtube}" target="_blank" class="d-inline-block icon-youtube">
            <i class="fab fa-youtube fa-fw fa-lg"></i>
            <!-- <svg width="1.5em" height="1.5em" version="1.1" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#icon-youtube" /></svg> -->
          </a>
          <a id="sidebar-icon-bilibili" href="https://space.bilibili.com/${member.bilibili}" target="_blank" class="d-inline-block icon-bilibili">
            <i class="fab fa-bilibili fa-fw fa-lg"></i>
            <!-- <svg width="1.5em" height="1.5em" version="1.1" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#icon-bilibili" /></svg> -->
          </a>`;
    if (member.fanbox) {
      homeContainerHtml += `<a id="sidebar-icon-fanbox" href="https://${member.fanbox}.fanbox.cc/" target="_blank" class="d-inline-block icon-fanbox">
          <i class="fas fa-gift fa-fw fa-lg"></i>
          <!-- <svg width="1.8em" height="1.3em" version="1.1" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#icon-fanbox" /></svg> -->
        </a>`;
    }
    if (member.booth) {
      homeContainerHtml += `<a id="sidebar-icon-booth" href="https://${member.booth}.booth.pm/" target="_blank" class="d-inline-block icon-booth">
          <i class="fas fa-store fa-fw fa-lg"></i>
          <!-- <svg width="1.5em" height="1.4em" version="1.1" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#icon-booth" /></svg> -->
        </a>`;
    }
    homeContainerHtml += `</div>
        <div class="text-center">
          <ul class="list-unstyled mb-0 mt-2">
            <li>${member.profile.nameCN}</li>
            <li>${member.profile.nameEN}</li>
            <li>${member.profile.class}年生</li>
            <li class="twemoji">${member.profile.mark}</li>
          </ul>
        </div>
      </div>`;
    $('#home-container .row').append(homeContainerHtml);
  }
  $('#songs-container').remove();
};

/**
 * Register a play button's click event.
 * @function registerPlayButtonClickEvent
 * @param {string} section A section ID.
 * @param {Object[] | null} playlist An APlayer playlist.
 */
const registerPlayButtonClickEvent = (section, playlist) => {
  if (playlist.length) {
    $(`#aplayer-play-${section} > a`).click(e => {
      if (aplayerCurrentPlaylistSection !== section) {
        aplayer.pause();
        aplayer.list.clear();
        aplayer.list.add(playlist);
        aplayer.play();
        aplayerCurrentPlaylistSection = section;
      } else if (aplayer.audio.paused) {
        aplayer.play();
      }
      e.preventDefault();  // Cancel the default action: https://stackoverflow.com/a/3252735
    });
  } else {
    $(`#aplayer-play-${section}`).remove();
  }
};

$(document).ready(async () => {
  try {
    const memberId = urlParams['v'] ? urlParams['v'].toLowerCase() : null;
    if (memberId && HANAYORI_MEMBER_IDS.includes(memberId)) {
      const memberJSON = await getJSON(memberId);
      const songSections = processMemberJSON(memberJSON);

      const originalTrackSongsJSON = await getJSON(ORIGINAL_TRACK_SONGS_FILENAME);
      const originalTrackSongs = processOriginalTrackSongsJSON(originalTrackSongsJSON);

      renderPage(memberId);
      for (let i = 0; i < songSections.length; i++) {
        renderSection(SECTIONS[i], memberId, songSections[i], originalTrackSongs);
      }
      // Create APlayer: https://aplayer.js.org/#/zh-Hans/
      if (aplayerPvPlaylist.length) {
        aplayer = new APlayer({
          audio: aplayerPvPlaylist,
          container: $('#aplayer')[0],
          fixed: true,
          listFolded: true,
          preload: 'none',
          theme: ARTISTS.get(memberId).resources.color,
          volume: .5
        });
        if ($(window).width() >= 992) {
          aplayer.setMode('normal');
        }
      }
      // Register play buttons' click events
      registerPlayButtonClickEvent(SECTIONS[0], aplayerPvPlaylist);
      registerPlayButtonClickEvent(SECTIONS[2], aplayerLiveCutoutPlaylist);
    } else {
      renderHomepage();
    }
  } catch (error) {
    console.error(error);
  } finally {
    $('[data-toggle="tooltip"]').tooltip();
    // Parse Twitter emojis: https://github.com/twitter/twemoji
    $('.twemoji').each((_, element) => twemoji.parse($(element).get(0)));
    // Back to top: https://github.com/vfeskov/vanilla-back-to-top
    addBackToTop({
      backgroundColor: 'rgba(255, 82, 82, .6)',
      diameter: 40, // px
      showWhenScrollTopIs: 300, // px
      textColor: '#fff'
    });
  }
});

// Stick the sidebar when scrolling
$(window).on('scroll', () => {
  if ($(window).width() >= 992) {
    if ($(window).scrollTop() > $('header.banner').outerHeight()) {
      $('aside').addClass('affix-top');
    } else {
      $('aside').removeClass('affix-top');
    }
  }
});

// Pause APlayer when opening a video
$(document).on('lity:open', (event, instance) => {
  if (aplayer instanceof APlayer) {
    if (!aplayer.audio.paused) {
      shouldResumeAplayer = true;
    }
    aplayer.pause();
  }
});

// Resume APlayer after video is closed
$(document).on('lity:remove', function(event, instance) {
  if (aplayer instanceof APlayer && shouldResumeAplayer) {
    shouldResumeAplayer = false;
    aplayer.play();
  }
});
