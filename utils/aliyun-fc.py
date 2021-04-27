# -*- coding: utf-8 -*-

import logging
import re
import requests
from urllib.parse import parse_qs

logger = logging.getLogger()

# To enable the initializer feature (https://help.aliyun.com/document_detail/158208.html)
# please implement the initializer function as below：
# def initializer(context):
#    logger = logging.getLogger()  
#    logger.info('initializing')

def get_cid(bvid: str, page=1) -> int:
    """Get chat ID (cid) of a Bilibili video.

    :param bvid: BV ID of the video
    :param page: page of the video
    :return: chat ID (cid) of the video
    :rtype: int
    """
    cid = 0
    params = {
        'bvid': bvid
    }
    response = requests.get(
        url='https://api.bilibili.com/x/web-interface/view',
        params=params
    )
    data = response.json()
    if data['code'] == 0 and data['data'] and type(data['data']['pages']) is list:
        for p in data['data']['pages']:
            if p['page'] == page:
                cid = p['cid']
                break
    return cid


def get_url(bvid: str, cid: int, audio_only=False) -> str:
    """Get direct URL of a Bilibili video or audio.

    :param bvid: BV ID of the video
    :param cid: chat ID (cid) of the video
    :param audio_only: get audio or video
    :return: direct URL of the video or audio
    :rtype: str
    """
    params = {
        'bvid': bvid,
        'cid': cid,
        'fnval': 0,  # FLV format
        'fourk': 1,
        'otype': 'json',
        'qn': 120
    }
    if audio_only:
        params['fnval'] = 16  # DASH format
    response = requests.get(
        url='https://api.bilibili.com/x/player/playurl',
        params=params
    )
    data = response.json()
    bcache_pattern = r':\\?\/\\?\/[^\/]+bcache[^\/]+\\?\/'  # https://github.com/ipcjs/bilibili-helper/blob/e0132b/scripts/bilibili_bangumi_area_limit_hack.user.js#L999
    url = None
    if data['code'] == 0 and data['data']:
        if audio_only and data['data']['dash'] and type(data['data']['dash']['audio']) is list and len(data['data']['dash']['audio']) > 0 and data['data']['dash']['audio'][0]['base_url']:
            url = data['data']['dash']['audio'][0]['base_url']
            if re.search(bcache_pattern, url) and type(data['data']['dash']['audio'][0]['backup_url']) is list and len(data['data']['dash']['audio'][0]['backup_url']) > 0 and not re.search(bcache_pattern, data['data']['dash']['audio'][0]['backup_url'][0]):
                url = data['data']['dash']['audio'][0]['backup_url'][0]
        elif type(data['data']['durl']) is list and len(data['data']['durl']) > 0 and data['data']['durl'][0]['url']:
            url = data['data']['durl'][0]['url']
            if re.search(bcache_pattern, url) and type(data['data']['durl'][0]['backup_url']) is list and len(data['data']['durl'][0]['backup_url']) > 0 and not re.search(bcache_pattern, data['data']['durl'][0]['backup_url'][0]):
                url = data['data']['durl'][0]['backup_url'][0]
    return url


def handler(environ, start_response):
    context = environ['fc.context']
    request_uri = environ['fc.request_uri']
    for k, v in environ.items():
        if k.startswith('HTTP_'):
            # process custom request headers
            pass

    # Extract query parameters
    query = parse_qs(environ.get('QUERY_STRING', ''))
    bvid = query.get('bvid')
    bvid = bvid[0] if bvid and bvid[0] and bvid[0].startswith('BV') else None
    page = query.get('p')
    page = int(page[0]) if page and page[0] and page[0].isdigit() else 1
    audio_only = query.get('audioOnly')
    audio_only = True if audio_only[0] and (audio_only[0] == '1' or audio_only[0] == 'true') else False
    # Call Bilibili APIs
    cid = get_cid(bvid, page)
    url = get_url(bvid, cid, audio_only) if cid != 0 else None
    # Redirect
    if type(url) is str and url.startswith('http'):
        status = '302 Found'
        response_headers = [
            ('Location', url),
            ('Referer', 'https://www.bilibili.com/video/%s?p=%d' % (bvid, page)),
            ('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0')
        ]
    else:
        status = '404 Not Found'
        response_headers = [('Content-type', 'text/plain; charset=UTF-8')]
    start_response(status, response_headers)
    return [b'0']
