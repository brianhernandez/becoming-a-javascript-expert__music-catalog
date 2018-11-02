'use strict';
// let now = new Date();
// document.cookie = 'lastUpdateDate=' + now.getTime();

// Check if the browser supports IDBObjectStore
// let queryString = 'tag.gettopalbums&tag=kpop&limit=20&api_key=',
// var dbVer = 1;
if ('indexedDB' in window) {
  let topTracksOrAlbumsStr,
      trackAndAlbumButtons = document.querySelectorAll('.header__button'),
      inputField = document.querySelector('.header__input');
  // If our custom cookie is found on the browser, render last time the catalog was updated.
  if (document.cookie.indexOf('lastUpdateDate') >= 0) {
    // renderLastUpdateDate();
    // getAlbumRecordsFromDB();
    // let openRequest = window.indexedDB.open('LocalMusicDBStore');
		//     openRequest.onsuccess = function(event) {
    //       console.log('opened LocalMusicDBStore DB');
    //     }
    //     openRequest.onsuccess.onerror = function(event) {
    //       console.log('NOT opened LocalMusicDBStore DB');
    //     }
  } else {
    // the visitor has no cookie so they have never called the api before

  }

  trackAndAlbumButtons.forEach(function(element) {
    element.addEventListener('click', function(event) {
      let textInputEl = document.querySelector('.header__input'),
          genreString = '&tag=' + textInputEl.value;

      if (textInputEl.value === '') {
        alert('You\'ll need to enter a music genre to get the top results.');
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
        lastUpdateDateEl = document.querySelector('.header__message');
    // console.log(lastUpdateDateStr);
    // console.log(lastUpdateDateObj);
    // If the last updated date string has been rendered already, replace it.
    if (lastUpdateDateEl) {
      lastUpdateDateEl.innerHTML = formatHumanDate();
      // Else, create a new last update date message and render to the browser.
    } else {
      // console.log(formatHumanDate());
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
      console.log('This is the response:');
      console.log(response);
      let albumList = response.albums.album;
      // if (APIQueryString.indexOf('tag.gettopalbums') >= 0) {
      //   albumList = response.albums.album;
      // } else {
      //   albumList = response.tracks.track;
      // }
      // let albumList = response.albums.album,
        let albumsArray = [],
          now = new Date();
          document.cookie = 'lastUpdateDate=' + now.getTime();
          renderLastUpdateDate();
          console.log(response);
      // For all albums received, create an object that holds some basic attributes of each album
      for (let i = 0; i < albumList.length; i++) {
        let albumObject = {};
        albumObject.name = albumList[i].name;
        albumObject.artist = albumList[i].artist.name;
        albumObject.url = albumList[i].url;
        albumObject.album_art = albumList[i].image[2]['#text'];
        albumObject.rank = albumList[i]['@attr'].rank;
        // Add this simplified album info object to the albumsArray
        albumsArray.push(albumObject);
      }
      // console.log(response);
      // console.log(albumsArray);

      createAndUpdateLocalMusicDBStore(albumsArray);
      // Return the completed array of simplified album info objs received from the api response
      // return albumsArray;
    }).fail(function() {
      // Handle a failure to get api response here
    });
  }
  // Function to take Last.fm API response, create an IndexedDB and save response to the DB
  function createAndUpdateLocalMusicDBStore(APIResponse) {
    // console.log('createAndUpdateLocalMusicDBStore func called');
    // console.log(APIResponse);
    var db = window.indexedDB.open('LocalMusicDBStore');
        db.onupgradeneeded = function(event) {

      console.log('DB created successfully');
      console.log('Creating objectStore....');

      let objectStore = event.target.result.createObjectStore('CurrentTopAlbums', { autoIncrement: true });

      objectStore.transaction.oncomplete = function(event) {
        console.log('objectStore created successfully');
      }
    }

    db.onsuccess = function(event) {
      console.log('DB db.onsuccess Accessed Successfully');
      let currentTopAlbumsObjStr = event.target.result.transaction('CurrentTopAlbums', 'readwrite').objectStore('CurrentTopAlbums'),
          currentTopAlbums = APIResponse;

      currentTopAlbumsObjStr.clear().onsuccess = function(event) {
        console.log('DB deleted successfully.');

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
      console.log('Fields need to be updated here.');
      console.log(albumData.length);
      console.log(albumData);
      let albumDivsArr = document.querySelectorAll('.albums__album'),
          albumArtistUrlArr = document.querySelectorAll('.albums__album-artist-url'),
          albumRankBadgeArr = document.querySelectorAll('.albums__album-rank-badge'),
          albumImgArr = document.querySelectorAll('.albums__album-art'),
          albumNameArr = document.querySelectorAll('.albums__album-name'),
          albumArtist = document.querySelectorAll('.albums__album-artist');

      console.log(albumDivsArr);
      for (let i = 0; i < albumData.length; i++) {
        albumArtistUrlArr[i].href = albumData[i].url;
        albumImgArr[i].src = albumData[i].album_art;
        albumNameArr[i].innerHTML = albumData[i].name;
        albumArtist[i].innerHTML = albumData[i].artist;
      }
    }

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