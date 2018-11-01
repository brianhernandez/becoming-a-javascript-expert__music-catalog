'use strict';
// let now = new Date();
// document.cookie = 'lastUpdateDate=' + now.getTime();

// Check if the browser supports IDBObjectStore
// let queryString = 'tag.gettopalbums&tag=kpop&limit=20&api_key=',

if ('indexedDB' in window) {
  let topTracksOrAlbumsStr,
      trackAndAlbumButtons = document.querySelectorAll('.header__button');
  // If our custom cookie is found on the browser, render last time the catalog was updated.
  if (document.cookie.indexOf('lastUpdateDate') >= 0) {
    console.log('we have a cookie.');
    renderLastUpdateDate();
    getAlbumRecordsFromDB();
    // loadCatalogFromIndexedDB();
    // pull saved data from indexedDB and render to the page
  } else {
    // the visitor has no cookie so they have never called the api before

  }

  trackAndAlbumButtons.forEach(function(element) {
    element.addEventListener('click', function(event) {
      let textInputEl = document.querySelector('.header__input');
      let genreString = '&tag=' + textInputEl.value;
      // let queryString;
      trackAndAlbumButtons.forEach(function(element) {
        element.classList.remove('is-active');
      });
      event.target.classList.add('is-active');
      console.log(genreString);
      console.log(event.target.id);
      // console.log(this.target);
      if (event.target.id === 'getTopAlbums') {
        topTracksOrAlbumsStr = 'tag.gettopalbums';
      } else {
        topTracksOrAlbumsStr = 'tag.gettoptracks';
      }
      // queryString =
      // createLocalMusicDBStore(response);
      requestLastFmAPIResponse(topTracksOrAlbumsStr + genreString);
    });
  });

  // Function to render last update date to browser or replace the message with most current date
  function renderLastUpdateDate() {
    // Create a new date object from the time stamp found in our site's cookie.
    let findDateRegEx = /lastUpdateDate=([0-9]+);?/g,
        dateMatch = findDateRegEx.exec(document.cookie),
        lastUpdateDateStr = dateMatch[1],
        lastUpdateDateObj = new Date(parseInt(lastUpdateDateStr)),
        lastUpdateDateEl = document.querySelector('.header__message');
    console.log(lastUpdateDateStr);
    console.log(lastUpdateDateObj);
    // If the last updated date string has been rendered already, replace it.
    if (lastUpdateDateEl) {
      lastUpdateDateEl.innerHTML = formatHumanDate();
      // Else, create a new last update date message and render to the browser.
    } else {
      console.log(formatHumanDate());
      let lastUpdateDateEl = document.createElement('p');
      lastUpdateDateEl.className = '.header__message';
      lastUpdateDateEl.innerHTML = formatHumanDate();
      document.querySelector('.header__message').appendChild(lastUpdateDateEl);
    }
    // Format the last updated date message to human readable.
    function formatHumanDate() {
      return 'This catalog was last updated on '+lastUpdateDateObj.toLocaleDateString("en-US")
        +' at '+lastUpdateDateObj.toLocaleTimeString("en-US")+'.';
    }
  }
  // Function to take api request query, create and send an AJAx call and return the response.
  function requestLastFmAPIResponse(APIQueryString) {
    const API_KEY = '&limit=20&api_key=642b7968fcdd1af2738659d02a8d60dc&format=json',
          // ###### CHANGE TO HTTPS WHEN DEPLOYING ON GITHUB ########
          API_ROOT = 'http://ws.audioscrobbler.com/2.0/?method='
    // Send GET request to Last.fm API using built query string
    $.ajax({
      url: API_ROOT + APIQueryString + API_KEY,
      dataType: 'json'
      // If successfully received, initialize an array that will hold a simplified subset of reponse
    }).done(function(response) {
      let albumList = response.albums.album,
          albumsArray = [],
          now = new Date();
          document.cookie = 'lastUpdateDate=' + now.getTime();
          renderLastUpdateDate();
      // For all albums received, create an object that holds some basic attributes of each album
      for (let i = 0; i < albumList.length; i++) {
        let albumObject = {};
        albumObject.name = albumList[i].name;
        albumObject.artist = albumList[i].artist.name;
        albumObject.url = albumList[i].url;
        albumObject.album_art = albumList[i].image[2]['#text'];
        albumObject.album_rank_in_genre = albumList[i]['@attr'].rank;
        // Add this simplified album info object to the albumsArray
        albumsArray.push(albumObject);
      }
      console.log(response);
      console.log(albumsArray);

      createLocalMusicDBStore(albumsArray);
      // Return the completed array of simplified album info objs received from the api response
      // return albumsArray;
    }).fail(function() {
      // Handle a failure to get api response here
    });
  }
  // Function to take Last.fm API response, create an IndexedDB and save response to the DB
  function createLocalMusicDBStore(APIResponse) {
    console.log('createLocalMusicDBStore func called');
    let openIDBRequest = window.indexedDB.open('LocalMusicDBStore', 1);

    openIDBRequest.onupgradeneeded = function(event) {
      let db = event.target.result,
          objectStore = db.createObjectStore('CurrentTopAlbums', { autoIncrement: true });

      objectStore.transaction.oncomplete = function(event) {
        let transaction = db.transaction('CurrentTopAlbums', 'readwrite'),
            currentTopAlbumsObjStr = transaction.objectStore('CurrentTopAlbums'),
            CurrentTopAlbums = APIResponse;
            CurrentTopAlbums.forEach(function(album) {
              currentTopAlbumsObjStr.add(album);
            });
            getAlbumRecordsFromDB();
      }
    }
  }
  // Function to retrieve stored album records from DB
  function getAlbumRecordsFromDB() {
    let openIDBRequest = window.indexedDB.open('LocalMusicDBStore');

    openIDBRequest.onsuccess = function(event) {
      console.log('getAlbumRecordsDB func open request success');
      let db = event.target.result,
          transaction = db.transaction('CurrentTopAlbums', 'readonly'),
          currentTopAlbumsObjStr = transaction.objectStore('CurrentTopAlbums'),
          getAllAlbumsStored = currentTopAlbumsObjStr.getAll();

      getAllAlbumsStored.onsuccess = function(event) {
        let allStoredAlbumsInDB = event.target.result;
        console.log(allStoredAlbumsInDB);
        // Call function that will render or update the new records to browser
        renderOrUpdateAlbumsToBrowser(allStoredAlbumsInDB);
      }
    }
  }
  // Function that renders or updates stored music records in DB into browser
  function renderOrUpdateAlbumsToBrowser(albumsInDB) {
    if (document.querySelector('.albums')) {
      updateFields(albumsInDB);
    } else {
      createFields(albumsInDB);
    }

    function updateFields(albumData) {

    }

    function createFields(albumData) {
      let albumsContainerDiv = document.createElement('div');
          albumsContainerDiv.classList = 'albums';
      for (let i = 0; i < albumData.length; i++) {
        let albumDiv = document.createElement('div');
            albumDiv.classList = 'albums__album';
            albumDiv.id = 'rank_' + albumData[i].album_rank_in_genre;
        let albumArtistUrl = document.createElement('a');
            albumArtistUrl.href = albumData[i].url;
            albumArtistUrl.classList = 'albums__album-artist-url';
        let albumRankBadge = document.createElement('span');
            albumRankBadge.classList = 'albums__album-rank-badge';
            albumRankBadge.innerHTML = '#' + albumData[i].album_rank_in_genre;
        let albumImg = document.createElement('img');
            albumImg.classList = 'albums__album-art';
            albumImg.src = albumData[i].album_art;
            albumImg.setAttribute('alt', albumData[i].name + ' Album Art');
        let albumNameLabel = document.createElement('h4');
            albumNameLabel.classList = 'albums__label';
            albumNameLabel.innerHTML = 'album name';
        let albumName = document.createElement('p');
            albumName.classList = 'albums__album-name';
            albumName.innerHTML = albumData[i].name;
        let albumArtistLabel = document.createElement('h4');
            albumArtistLabel.classList = 'albums__label';
            albumArtistLabel.innerHTML = 'artist';
        let albumArtist = document.createElement('p');
            albumArtist.innerHTML = albumData[i].artist;
            albumArtist.classList = 'albums__album-artist';

        albumArtistUrl.appendChild(albumRankBadge);
        albumArtistUrl.appendChild(albumImg);
        albumDiv.appendChild(albumArtistUrl);;
        albumDiv.appendChild(albumNameLabel);
        albumDiv.appendChild(albumName);
        albumDiv.appendChild(albumArtistLabel);
        albumDiv.appendChild(albumArtist);
        albumsContainerDiv.appendChild(albumDiv);
      }

      document.querySelector('#app').appendChild(albumsContainerDiv);
    }
  }

} else {
  alert('This app requires a modern web browser that has the IDBObjectStore feature to use.');
}