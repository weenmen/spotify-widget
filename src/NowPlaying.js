import './styles.css';
import React, { useEffect, useState } from 'react';
import querystring from 'querystring';
import { Buffer } from 'buffer';

const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

// 🔐 Replace with your real values
const client_id = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const client_secret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
const refresh_token = process.env.REACT_APP_SPOTIFY_REFRESH_TOKEN;

export const getAccessToken = async () => {
  const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: querystring.stringify({
      grant_type: 'refresh_token',
      refresh_token,
    }),
  });

  return response.json();
};

export const getNowPlaying = async () => {
  try {
    const { access_token } = await getAccessToken();

    const response = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (response.status > 400) {
      throw new Error('Unable to Fetch Song');
    } else if (response.status === 204) {
      throw new Error('Currently Not Playing');
    }

    const song = await response.json();
    const albumImageUrl = song.item.album.images[0].url;
    const artist = song.item.artists.map((artist) => artist.name).join(', ');
    const isPlaying = song.is_playing;
    const songUrl = song.item.external_urls.spotify;
    const title = song.item.name;
    const timePlayed = song.progress_ms;
    const timeTotal = song.item.duration_ms;

    return {
      albumImageUrl,
      artist,
      isPlaying,
      songUrl,
      title,
      timePlayed,
      timeTotal,
    };
  } catch (error) {
    console.error('Error fetching currently playing song: ', error);
    return error.message.toString();
  }
};

const NowPlaying = () => {
  const [nowPlaying, setNowPlaying] = useState(null);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      const data = await getNowPlaying();
      setNowPlaying(data);
    };

    const interval = setInterval(() => {
      fetchNowPlaying();
    }, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (!nowPlaying) {
    return <div>Loading...</div>;
  }

  if (typeof nowPlaying === 'string') {
    return <div>{nowPlaying}</div>;
  }

  const secondsPlayed = Math.floor(nowPlaying.timePlayed / 1000) % 60;
  const minutesPlayed = Math.floor(nowPlaying.timePlayed / 60000);
  const secondsTotal = Math.floor(nowPlaying.timeTotal / 1000) % 60;
  const minutesTotal = Math.floor(nowPlaying.timeTotal / 60000);

  return (
    <div className="nowPlayingCard">
      <div className="nowPlayingImage">
        <img src={nowPlaying.albumImageUrl} alt="Album cover" />
      </div>
      <div id="nowPlayingDetails">
        <div className="nowPlayingTitle">{nowPlaying.title}</div>
        <div className="nowPlayingArtist">{nowPlaying.artist}</div>
        <div className="nowPlayingTime">
          {`${minutesPlayed}:${secondsPlayed.toString().padStart(2, '0')} / ${minutesTotal}:${secondsTotal.toString().padStart(2, '0')}`}
        </div>
        <a href={nowPlaying.songUrl} target="_blank" rel="noopener noreferrer">
          Open in Spotify
        </a>
      </div>
    </div>
  );
};

export default NowPlaying;
