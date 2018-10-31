'use strict';
// let now = new Date();
// document.cookie = 'lastUpdateDate=' + now.getTime();

// Check if the browser supports IDBObjectStore
// let response = [{
//                     name: 'Jimmy',
//                     email: 'jimmy@domain.com',
//                     phone: 234564
//                   },
//                   {
//                     name: 'Sally',
//                     email: 'sally@domain.com',
//                     phone: 294721
//                   },
//                   {
//                     name: 'Danny',
//                     email: 'danny@domain.com',
//                     phone: 900635
//                   },
//                   {
//                     name: 'Suzie',
//                     email: 'suzie@domain.com',
//                     phone: 113890
//                   },
//                   {
//                     name: 'Tommy',
//                     email: 'tommy@domain.com',
//                     phone: 334227
//                   }];
let queryString = 'tag.gettopalbums&tag=kpop&limit=20&api_key=';
let getTopAlbumButtEl = document.querySelector('.header__button-get-Top-Albums');
if ('indexedDB' in window) {
  // If our custom cookie is found on the browser, render last time the catalog was updated.
  if (document.cookie.indexOf('lastUpdateDate') >= 0) {
    console.log('we have a cookie.');
    renderLastUpdateDate();
    // loadCatalogFromIndexedDB();
    // pull saved data from indexedDB and render to the page
  } else {
    // the visitor has no cookie so they have never called the api before

  }

  getTopAlbumButtEl.addEventListener('click', function(event) {
    // createLocalMusicDBStore(response);
    requestLastFmAPIResponse(queryString);
  });


  // Function to render last update date to browser or replace the message with most current date
  function renderLastUpdateDate() {
    // Create a new date object from the time stamp found in our site's cookie.
    let findDateRegEx = /lastUpdateDate=([0-9]+);?/g,
        dateMatch = findDateRegEx.exec(document.cookie),
        lastUpdateDateStr = dateMatch[1],
        lastUpdateDateObj = new Date(parseInt(lastUpdateDateStr)),
        lastUpdateDateEl = document.querySelector('.header__last-update-date');
    console.log(lastUpdateDateStr);
    console.log(lastUpdateDateObj);
    // If the last updated date string has been rendered already, replace it.
    if (lastUpdateDateEl) {
      lastUpdateDateEl.innerHTML = formatHumanDate();
      // Else, create a new last update date message and render to the browser.
    } else {
      console.log(formatHumanDate());
      let lastUpdateDateEl = document.createElement('p');
      lastUpdateDateEl.className = '.header__last-update-date';
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
    const API_KEY = '642b7968fcdd1af2738659d02a8d60dc&format=json',
          API_ROOT = 'https://ws.audioscrobbler.com/2.0/?method='

    $.ajax({
      url: API_ROOT + APIQueryString + API_KEY,
      dataType: 'json'
    }).done(function(response) {
      let albumList = response.albums.album,
          albumsArray = [];

      for (let i = 0; i < albumList.length; i++) {
        let albumObject = {};
        albumObject.name = albumList[i].name;
        albumObject.artist = albumList[i].artist.name;
        albumObject.album_art = albumList[i].image[2]['#text'];
        albumObject.album_rank_in_genre = albumList[i]['@attr'].rank;
        albumsArray.push(albumObject);
      }
      console.log(albumsArray);
      createLocalMusicDBStore(albumsArray)
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
          objectStore = db.createObjectStore('CurrentTopAlbums', { keyPath: 'album_rank_in_genre' });

      objectStore.transaction.oncomplete = function(event) {
        let transaction = db.transaction('CurrentTopAlbums', 'readwrite'),
            currentTopAlbumsObjStr = transaction.objectStore('CurrentTopAlbums'),
            CurrentTopAlbums = APIResponse;
            CurrentTopAlbums.forEach(function(album) {
              currentTopAlbumsObjStr.add(album);
            });
      }
    }
  }
  // Function to render saved Last.fm API response to browser
  function loadCatalogFromIndexedDB() {

  }

} else {
  alert('This app requires a modern web browser that has the IDBObjectStore feature to use.');
}