'use strict';

import { Artist, HanayoriMember, ARTISTS, BILIBILI_PLAYLIST_PAGES, HANAYORI_MEMBER_IDS, LANGUAGE } from './shared.mjs';

/** Class representing a video source. */
class Source {
  /**
   * Create a source object.
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

/** Class representing a Bilibili video source. */
class BilibiliSource extends Source {
  /**
   * Create a Bilibili source object.
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
}

/** Class representing a YouTube video source. */
class YouTubeSource extends Source {
  /**
   * Create a YouTube source object.
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
   * Create a Song object.
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
          switch (key) {
          case 'date':
            source.set(key, new Date(value));
            break;
          case 'youtube':
            source.set(key, new YouTubeSource(value));
            break;
          case 'bilibili': case 'bilibiliAlt':
            source.set(key, new BilibiliSource(value));
            break;
          default:
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

// Icon fonts: https://www.iconfont.cn/user/detail?uid=5455300
const BILIBILI_ICON = '<svg width="1.3em" height="1.3em" version="1.1" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#icon-bilibili" /></svg>';
const NICONICO_ICON = '<svg width="1em" height="1em" version="1.1" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#icon-niconico" /></svg>';
const YOUTUBE_ICON = '<svg width="1.3em" height="1.3em" version="1.1" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#icon-youtube" /></svg>';
// Other constants
const SECTIONS = ['pv', 'special', 'live'];

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
 * @param {string} memberId A member ID.
 * @return {JSON} A JSON object.
 */
const getJSON = async (memberId) => {
  return $.getJSON(`data/${memberId}.json`).fail(() => {
    console.error('An error has occurred.');
  });
};

/**
 * Process a JSON object.
 * @function processJSON
 * @param {JSON} json A JSON object.
 * @return {Song[][]} A 2-dimensional array of Song objects.
 */
const processJSON = (json) => {
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
 * Render song collection page.
 * @function renderPage
 * @param {string} memberId A member ID.
 */
const renderPage = (memberId) => {
  const member = ARTISTS.get(memberId);
  $(document).attr('title', member.name);
  $('header.banner').css('background-image', `url('${member.resources.banner}')`);
  $('aside img.avatar').attr('src', member.resources.avatar);
  $('aside #member-name').html(member.nameWithRubyStyling);
  $('#sidebar-icon-twitter').attr('href', `https://twitter.com/${member.twitter}`);
  $('#sidebar-icon-youtube').attr('href', `https://youtube.com/channel/${member.youtube}`);
  $('#sidebar-icon-bilibili').attr('href', `https://space.bilibili.com/${member.bilibili}`);
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
  }
  $('#home-container').remove();
  $('#songs-container').removeClass('d-none');
  $('#back-to-home-arrow').removeClass('d-none');
};

/**
 * Render song section.
 * @function renderSection
 * @param {string} section A section ID.
 * @param {Song[]} songs An array of Song objects.
 */
const renderSection = (section, songs) => {
  if (songs && songs.length) {
    $(`#${section}-section table tbody`).empty();
    $(`#${section}-section h5`).text($(`#${section}-section h5`).text() + ` (${songs.length})`);
    for (const song of songs) {
      const language = LANGUAGE.has(song.language) ? LANGUAGE.get(song.language) : LANGUAGE.get('undefined');
      let songNameHtml = song.name;
      // Build HTML for collaborators
      let otherArtistsHtml = '';
      if (Array.isArray(song.otherArtists)) {
        for (let i = 0; i < song.otherArtists.length; i++) {
          const otherArtist = song.otherArtists[i];
          if (otherArtist instanceof HanayoriMember) {
            otherArtistsHtml += `<a href="./?v=${otherArtist.id}">${otherArtist.name}</a>`;
          } else if (otherArtist instanceof Artist) {
            otherArtistsHtml += otherArtist.name;
          } else {
            otherArtistsHtml += otherArtist;
          }
          if (i < song.otherArtists.length - 1) {
            otherArtistsHtml += '・';
          }
        }
      }
      if (otherArtistsHtml) {
        songNameHtml += `<br><span class="other-artists">With ${otherArtistsHtml}</span>`;
      }

      if (section === 'pv' || section === 'special') {
        // Build HTML for sources
        let sourceHtml = '';
        if (Array.isArray(song.clips) && song.clips.length === 1) {
          for (const [key, source] of song.clips[0]) {
            switch (source.constructor) {
            case YouTubeSource:
              sourceHtml += (sourceHtml ? '&nbsp;' : '') + `<a href="${source.url}" class="icon-youtube" data-lity data-lity-target="${source.embedUrl}">${YOUTUBE_ICON}</a>`;
              break;
            case BilibiliSource:
              sourceHtml += (sourceHtml ? '&nbsp;' : '') + `<a href="${source.url}" class="icon-bilibili" data-lity data-lity-target="${source.embedUrl}">${BILIBILI_ICON}</a>`;
              break;
            }
          }
        }
        // Build table for PV or Special section
        if (section === 'pv') {
          $(`#${section}-section table tbody`).append(`<tr>                    
              <td>${songNameHtml}</td>
              <td>${language}</td>
              <td>${sourceHtml}</td>
              <td></td>
            </tr>`);
        } else {
          $(`#${section}-section table tbody`).append(`<tr>                    
              <td>${songNameHtml}</td>
              <td>${language}</td>
              <td>${sourceHtml}</td>
              <td></td>
              <td>${song.notes ? song.notes : ''}</td>
            </tr>`);
        }

      } else if (section === 'live') {
        let clips = [];
        if (Array.isArray(song.clips) && song.clips.length) {
          for (const clip of song.clips) {
            // Build HTML for date and sources
            let officialSourceHtml = '';
            let unofficialSourceHtml = '';
            for (const [key, source] of clip) {
              switch (key) {
              case 'youtube':
                officialSourceHtml += (officialSourceHtml ? '&nbsp;' : '') + `<a href="${source.url}" class="icon-youtube" data-lity data-lity-target="${source.embedUrl}">${YOUTUBE_ICON}</a>`;
                break;
              case 'bilibili':
                officialSourceHtml += (officialSourceHtml ? '&nbsp;' : '') + `<a href="${source.url}" class="icon-bilibili" data-lity data-lity-target="${source.embedUrl}">${BILIBILI_ICON}</a>`;
                break;
              case 'bilibiliAlt':
                unofficialSourceHtml += (unofficialSourceHtml ? '&nbsp;' : '') + `<a href="${source.url}" class="icon-bilibili" data-lity data-lity-target="${source.embedUrl}">${BILIBILI_ICON}</a>`;
                break;
              }
            }
            clips.push({
              'date': clip.get('date').toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                timeZone: 'Asia/Tokyo'
              }),
              'officialSources': officialSourceHtml,
              'unofficialSources': unofficialSourceHtml,
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
                <td>${clips[i].officialSources}</td>
                <td>${clips[i].unofficialSources}</td>
                <td${extraAttrs}></td>
                <td>${clips[i].notes}</td>
              </tr>`);
          } else {  // Other rows
            $(`#${section}-section table tbody`).append(`<tr>
                <td>${clips[i].date}</td>
                <td>${clips[i].officialSources}</td>
                <td>${clips[i].unofficialSources}</td>
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
  $('#back-to-home-arrow').remove();
  $('#home-container .row').empty();
  for (const memberId of HANAYORI_MEMBER_IDS) {
    const member = ARTISTS.get(memberId);
    $('#home-container .row').append(`<div class="col-6 col-md-3">
        <a href="./?v=${memberId}">
          <img alt="Avatar of ${member.profile.nameEN}" class="avatar rounded-circle" src="${member.resources.avatar}" />
        </a>
        <h4 class="text-center mt-2">${member.nameWithRubyStyling}</h4>
        <div class="text-center">
          <a id="sidebar-icon-twitter" href="https://twitter.com/${member.twitter}" target="_blank" class="d-inline-block icon-twitter mx-1">
            <svg width="1.5em" height="1.5em" version="1.1" xmlns="http://www.w3.org/2000/svg">
              <use xlink:href="#icon-twitter" />
            </svg>
          </a>
          <a id="sidebar-icon-youtube" href="https://youtube.com/channel/${member.youtube}" target="_blank" class="d-inline-block icon-youtube mx-1">
            <svg width="1.5em" height="1.5em" version="1.1" xmlns="http://www.w3.org/2000/svg">
              <use xlink:href="#icon-youtube" />
            </svg>
          </a>
          <a id="sidebar-icon-bilibili" href="https://space.bilibili.com/${member.bilibili}" target="_blank" class="d-inline-block icon-bilibili mx-1">
            <svg width="1.5em" height="1.5em" version="1.1" xmlns="http://www.w3.org/2000/svg">
              <use xlink:href="#icon-bilibili" />
            </svg>
          </a>
        </div>
        <div class="text-center">
          <ul class="list-unstyled mb-0 mt-3">
            <li>${member.profile.nameCN}</li>
            <li>${member.profile.nameEN}</li>
            <li>${member.profile.class}年生</li>
            <li class="twemoji">${member.profile.mark}</li>
          </ul>
        </div>
      </div>`);
  }
  $('#songs-container').remove();
};

$(document).ready(async () => {
  try {
    const memberId = urlParams['v'] ? urlParams['v'].toLowerCase() : null;
    if (memberId && HANAYORI_MEMBER_IDS.includes(memberId)) {
      const json = await getJSON(memberId);
      const songSections = processJSON(json);
      renderPage(memberId);
      for (let i = 0; i < songSections.length; i++) {
        renderSection(SECTIONS[i], songSections[i]);
      }
    } else {
      renderHomepage();
    }
  } catch (error) {
    console.error(error);
  } finally {
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
});
