import 'dotenv/config'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import express from 'express'
import SpotifyWebApi from 'spotify-web-api-node'
import axios from 'axios'

const baseUrl = process.env.BASE_URL

const app = express()

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.YOUR_CLIENT_ID,
  clientSecret: process.env.YOUR_CLIENT_SECRET,
  redirectUri: process.env.YOUR_REDIRECT_URI,
  refreshToken: process.env.YOUR_REFRESH_TOKEN,
})

app.get('/api', async (_, res) => {
  try {
    const assetsPath: string = path.resolve(__dirname, '../assets')
    const logoSvg: string = readFileSync(path.join(assetsPath, 'spotify_logo_rgb_green.svg'), {
      encoding: 'base64',
    })

    const data = await spotifyApi.refreshAccessToken()
    spotifyApi.setAccessToken(data.body['access_token'])
    const currentPlayingTrack = await spotifyApi.getMyCurrentPlayingTrack()

    let externalLink: string = '#'
    let cardImg: string = 'radial-gradient(#222922, #000500)'
    let cardTitle: string = 'No tracks'
    let cardSubtitle: string = ''
    let playing: boolean = false

    if (Object.keys(currentPlayingTrack.body).length > 0) {
      if (currentPlayingTrack.body.item) {
        const currentPlayingTrackBodyItem = currentPlayingTrack.body.item as SpotifyApi.TrackObjectFull
        externalLink = currentPlayingTrackBodyItem.album.external_urls.spotify
        const imgUrl = currentPlayingTrackBodyItem.album.images.filter(
          (image) => image.height === 300
        )[0].url

        const response = await axios.get(imgUrl, {
          responseType: 'arraybuffer',
        })

        cardImg = `url(data:image/png;base64,${Buffer.from(response.data, 'binary').toString(
          'base64'
        )})`
        cardTitle = currentPlayingTrackBodyItem.name
        cardSubtitle = currentPlayingTrackBodyItem.artists.map((artist) => artist.name).join(', ')
        playing = true
      }
    }

    res.setHeader('Content-Type', 'image/svg+xml')
    res.send(`<svg fill="none" viewBox="0 0 1000 250" width="1000" height="250" xmlns="http://www.w3.org/2000/svg">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              background-color: #000; /* Schwarzer Hintergrund für den unteren Bereich */
            }

            .external-link {
              text-decoration: none;
              display: flex;
              width: 100%;
              height: 100%;
            }

            .card {
              display: flex;
              flex: 1;
              border-radius: 16px;
              box-shadow: 0 3px 1px -2px rgba(0, 0, 0, .2), 0 2px 2px 0 rgba(0, 0, 0, .14), 0 1px 5px 0 rgba(0, 0, 0, .12);
              background-color: #1e1e1e;
              height: 25vh; /* 1/4 Bildschirmhöhe */
              width: 100%; /* Ganze Breite des Bildschirms */
            }

            .card__img {
              background-image: ${cardImg};
              background-repeat: no-repeat;
              background-size: cover;
              border-top-left-radius: 16px;
              border-bottom-left-radius: 16px;
              background-position: center;
              padding: 16px; /* Padding für das Bild */
              width: 30%;
              min-width: 150px;
            }

            .card__body {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: flex-start;
              padding: 16px;
              width: 70%;
              border-top-right-radius: 16px;
              border-bottom-right-radius: 16px;
            }

            .card__title {
              font: 600 20px 'Segoe UI', Ubuntu, Sans-Serif;
              color: #ffffff;
              margin-bottom: 8px;
              white-space: nowrap;
              overflow: hidden;
              display: flex;
              width: 100%;
              justify-content: flex-start;
            }

            .card__subtitle {
              font: 400 16px 'Segoe UI', Ubuntu, Sans-Serif;
              color: #aaaaaa;
              white-space: nowrap;
              overflow: hidden;
              display: flex;
              width: 100%;
              justify-content: flex-start;
            }

            .overlay {
              background-image: linear-gradient(transparent 0%, rgba(30, 215, 96, 0.1) 50%);
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
            }
          </style>
          <a class="external-link" href="${externalLink}" target="_blank">
            <div class="card">
              <div class="card__img"></div>
              <div class="card__body">
                <div class="card__title">
                  <span><![CDATA[${cardTitle}]]></span>
                </div>
                <div class="card__subtitle">
                  <span><![CDATA[${cardSubtitle}]]></span>
                </div>
              </div>
              <div class="${playing ? '' : 'overlay'}"></div>
            </div>
          </a>
        </div>
      </foreignObject>
    </svg>`)
    res.end()
  } catch (error) {
    console.error(JSON.stringify(error))
  }
})

if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log(`Server running at ${baseUrl}/api`)
  })
}

module.exports = app
