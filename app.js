'use strict';

if ('indexedDB' in window) {
  let topTracksOrAlbumsStr,
      trackAndAlbumButtons = document.querySelectorAll('.header__button'),
      inputField = document.querySelector('.header__input');
  // If our custom cookie is found on the browser, render last time the catalog was updated.
  if (document.cookie.indexOf('lastUpdateDate') >= 0) {
    renderLastUpdateDate();
    getAlbumRecordsFromDB();
  }

  trackAndAlbumButtons.forEach(function(element) {
    element.addEventListener('click', function(event) {
      let textInputEl = document.querySelector('.header__input'),
          genreString = '&tag=' + textInputEl.value;

      if (textInputEl.value === '') {
        alert('You\'ll need to enter a music tag to get its top results.');
        return;
      }

      trackAndAlbumButtons.forEach(function(element) {
        element.classList.remove('is-active');
      });

      event.target.classList.add('is-active');
      if (event.target.id === 'getTopAlbums') {
        topTracksOrAlbumsStr = 'tag.gettopalbums';
      } else {
        topTracksOrAlbumsStr = 'tag.gettoptracks';
      }

      requestLastFmAPIResponse(topTracksOrAlbumsStr + genreString);
    });
  });

  inputField.addEventListener('keyup', function(event) {
    let key = event.keyCode || event.which;

    if (key === 13) {
      if (document.querySelector('.is-active')) {
        document.querySelector('.is-active').click();
      } else {
        document.querySelector('#getTopAlbums').click();
      }
    }
  });

  // Function to render last update date to browser or replace the message with most current date
  function renderLastUpdateDate() {
    // Create a new date object from the time stamp found in our site's cookie.
    let findDateRegEx = /lastUpdateDate=([0-9]+);?/g,
        dateMatch = findDateRegEx.exec(document.cookie),
        lastUpdateDateStr = dateMatch[1],
        lastUpdateDateObj = new Date(parseInt(lastUpdateDateStr)),
        messageFieldEl = document.querySelector('.header__message');

    // If the last updated date string has been rendered already, replace it.
    if (messageFieldEl.classList.contains('warning')) {
      messageFieldEl.classList.remove('warning');
      // Else, create a new last update date message and render to the browser.
    }
    messageFieldEl.innerHTML = formatHumanDate();

    // Format the last updated date message to human readable.
    function formatHumanDate() {
      return 'These results were last updated on '+lastUpdateDateObj.toLocaleDateString("en-US")
        +' at '+lastUpdateDateObj.toLocaleTimeString("en-US")+'.';
    }
  }
  // Function to add no records found message to clearBrowserOfAllMusicRecords
  function renderNoRecordsFoundMessage() {
    let messageFieldEl = document.querySelector('.header__message');
    messageFieldEl.classList.add('warning');
    messageFieldEl.innerHTML = 'No results were found for the <span class="genre">"'+inputField.value+'"</span> tag.';
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
      let musicList,
          musicArray = [];

      if (APIQueryString.indexOf('tag.gettopalbums') >= 0) {
        musicList = response.albums.album;
        if (musicList.length === 0) {
          // Fire clear music records on browser function
          clearBrowserOfAllMusicRecords();
          renderNoRecordsFoundMessage();
          return;
        }
        // For all albums received, create an object that holds some basic attributes of each album
        for (let i = 0; i < musicList.length; i++) {
          let albumObject = {};
          albumObject.name = musicList[i].name;
          albumObject.artist = musicList[i].artist.name;
          albumObject.url = musicList[i].url;
          albumObject.album_art = musicList[i].image[2]['#text'];
          albumObject.rank = musicList[i]['@attr'].rank;
          albumObject.type = 'album';
          // Add this simplified album info object to the musicArray
          musicArray.push(albumObject);
        }

        let now = new Date();
        document.cookie = 'lastUpdateDate=' + now.getTime();
        renderLastUpdateDate();
      } else {
        musicList = response.tracks.track;
        if (musicList.length === 0) {
          // Fire clear music records on browser function
          clearBrowserOfAllMusicRecords();
          renderNoRecordsFoundMessage();
          return;
        }
        // For all albums received, create an object that holds some basic attributes of each album
        for (let i = 0; i < musicList.length; i++) {
          let albumObject = {};
          albumObject.name = musicList[i].name;
          albumObject.artist = musicList[i].artist.name;
          albumObject.url = musicList[i].url;
          albumObject.album_art = musicList[i].image[2]['#text'];
          albumObject.rank = musicList[i]['@attr'].rank;
          albumObject.type = 'track';
          // Add this simplified album info object to the musicArray
          musicArray.push(albumObject);
        }

        let now = new Date();
        document.cookie = 'lastUpdateDate=' + now.getTime();
        renderLastUpdateDate();
      }

      createAndUpdateLocalMusicDBStore(musicArray);
    }).fail(function() {
      alert('Something happened and a request to the API failed');
    });
  }
  // Function to take Last.fm API response, create an IndexedDB and save response to the DB
  function createAndUpdateLocalMusicDBStore(APIResponse) {
    var db = window.indexedDB.open('LocalMusicDBStore');
        db.onupgradeneeded = function(event) {
    let objectStore = event.target.result.createObjectStore('CurrentTopAlbums', { autoIncrement: true });

      objectStore.transaction.oncomplete = function(event) {
      }
    }

    db.onsuccess = function(event) {
      let currentTopAlbumsObjStr = event.target.result.transaction('CurrentTopAlbums', 'readwrite').objectStore('CurrentTopAlbums'),
          currentTopAlbums = APIResponse;

      currentTopAlbumsObjStr.clear().onsuccess = function(event) {

        currentTopAlbums.forEach(function(album) {
          currentTopAlbumsObjStr.put(album);
        });
        getAlbumRecordsFromDB();
      }
    }
  }
  // Function to retrieve stored album records from DB
  function getAlbumRecordsFromDB() {
    let openIDBRequest = window.indexedDB.open('LocalMusicDBStore');

    openIDBRequest.onsuccess = function(event) {
      let db = event.target.result,
          transaction = db.transaction('CurrentTopAlbums', 'readonly'),
          currentTopAlbumsObjStr = transaction.objectStore('CurrentTopAlbums'),
          getAllAlbumsStored = currentTopAlbumsObjStr.getAll();

      getAllAlbumsStored.onsuccess = function(event) {
        let allStoredAlbumsInDB = event.target.result;
        // Call function that will render or update the new records to browser
        renderOrUpdateAlbumsToBrowser(allStoredAlbumsInDB);
      }
    }
  }
  // Function that renders or updates stored music records in DB into browser
  function renderOrUpdateAlbumsToBrowser(albumsInDB) {
    clearBrowserOfAllMusicRecords();
    createFields(albumsInDB);

    function createFields(albumData) {
      let albumsContainerDiv = document.createElement('div');
          albumsContainerDiv.classList = 'albums';
      for (let i = 0; i < albumData.length; i++) {
        let albumDiv = document.createElement('div');
            albumDiv.classList = 'albums__album';
            albumDiv.id = 'rank_' + albumData[i].rank;
        let albumArtistUrl = document.createElement('a');
            albumArtistUrl.href = albumData[i].url;
            albumArtistUrl.classList = 'albums__album-artist-url';
        let albumRankBadge = document.createElement('span');
            albumRankBadge.classList = 'albums__album-rank-badge';
            albumRankBadge.innerHTML = '#' + albumData[i].rank;
        let albumImg = document.createElement('img');
            albumImg.classList = 'albums__album-art';
            albumImg.src = albumData[i].album_art;
            albumImg.setAttribute('alt', albumData[i].name + ' Album Art');
        let albumNameLabel = document.createElement('h4');
            albumNameLabel.classList = 'albums__label';
            albumNameLabel.innerHTML = albumData[i].type + ' Name';
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
  // Function that clears all old music records from browser
  function clearBrowserOfAllMusicRecords() {
    let musicRecordConDiv = document.querySelector('.albums');
    if (musicRecordConDiv) {
      document.querySelector('#app').removeChild(musicRecordConDiv);
    }
  }
} else {
  alert('This app requires a modern web browser that has the IDBObjectStore feature to use.');
}