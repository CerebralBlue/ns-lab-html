/* global window, document, $, hljs, elasticlunr, base_url, is_top_frame */
/* exported getParam, onIframeLoad */
"use strict";

var mainWindow = window;
//var mainWindow = is_top_frame ? window : (window.parent !== window ? window.parent : null);
var iframeWindow = null;
var rootUrl = qualifyUrl(base_url);
var searchIndex = null;
var showPageToc = true;
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

var Keys = {
  ENTER:  13,
  ESCAPE: 27,
  UP:     38,
  DOWN:   40,
};

function startsWith(str, prefix) { return str.lastIndexOf(prefix, 0) === 0; }
function endsWith(str, suffix) { return str.indexOf(suffix, str.length - suffix.length) !== -1; }

/**
 * Returns whether to use small-screen mode. Note that the same size is used in css @media block.
 */
function isSmallScreen() {
  return window.matchMedia("(max-width: 600px)").matches;
}

/**
 * Given a relative URL, returns the absolute one, relying on the browser to convert it.
 */
function qualifyUrl(url) {
  var a = document.createElement('a');
  a.href = url;
  return a.href;
}

/**
 * Turns an absolute path to relative, stripping out rootUrl and optionally preserving the anchor link.
 */
function getRelPath(targetAbsolutePath, preserveLinkHashes) {
  if (targetAbsolutePath.startsWith(rootUrl) || targetAbsolutePath.startsWith('..')) {
    if (!preserveLinkHashes) {
      targetAbsolutePath = targetAbsolutePath.split('#')[0];
    }
  } else {
    return targetAbsolutePath;
  }
  
  const targetPath = targetAbsolutePath.replace(/^https?:\/\/[^\/]+/, '');
  const currentPath = window.location.pathname;
  const depth = (currentPath.match(/\//g) || []).length;
  const relativePrefix = '../'.repeat(depth - 1); 
  let r = relativePrefix + targetPath.substring(1); 
  //console.log(r);
  return r;
}

/**
 * Returns the value of the given parameter in the URL's query portion.
 */
function getParam(key) {
  var params = window.location.search.substring(1).split('&');
  for (var i = 0; i < params.length; i++) {
    var param = params[i].split('=');
    if (param[0] === key) {
      return decodeURIComponent(param[1].replace(/\+/g, '%20'));
    }
  }
}

/**
 * Update the state of the button toggling table-of-contents. TOC has different behavior
 * depending on screen size, so the button's behavior depends on that too.
 */
function updateTocButtonState() {
  var shown;
  if (isSmallScreen()) {
    shown = $('.wm-toc-pane').hasClass('wm-toc-dropdown');
  } else {
    shown = !$('#main-content').hasClass('wm-toc-hidden');
  }
  $('#wm-toc-button').toggleClass('active', shown);
}

/**
 * When TOC is a dropdown (on small screens), close it.
 */
function closeTempItems() {
  $('.wm-toc-dropdown').removeClass('wm-toc-dropdown');
  $('#mkdocs-search-query').closest('.wm-top-tool').removeClass('wm-top-tool-expanded');
  updateTocButtonState();
}

/**
 * Visit the given URL, blocking the navigation if we're already on this page
 */
function visitUrl(url, event) {
  if (url !== null && url === mainWindow.location.href) {
    event.preventDefault();
    return;
  }
}

/**
 * Initialize the main window.
 */
function initMainWindow() {  
  $('a').each(function() { this.href = getRelPath(this.href, true); });

  var url = mainWindow.location.href;
  var relPath = getRelPath(url);
  renderPageToc(getTocLi(url), relPath, mainWindow.pageToc);

  // wm-toc-button either opens the table of contents in the side-pane, or (on smaller screens)
  // shows the side-pane as a drop-down.
  $('#wm-toc-button').on('click', function(e) {
    if (isSmallScreen()) {
      $('.wm-toc-pane').toggleClass('wm-toc-dropdown');
      $('#wm-main-content').removeClass('wm-toc-hidden');
    } else {
      $('#main-content').toggleClass('wm-toc-hidden');
      closeTempItems();
    }
    updateTocButtonState();
  });

  // Update the state of the wm-toc-button
  updateTocButtonState();
  $(window).on('resize', function() {
    updateTocButtonState();
  });

  // Connect up the Back and Forward buttons (if present).
  $('#hist-back').on('click', function(e) { window.history.back(); });
  $('#hist-fwd').on('click', function(e) { window.history.forward(); });

  // When the side-pane is a dropdown, hide it on click-away.
  $(window).on('blur', closeTempItems);

  // When we click on an opener in the table of contents, open it.
  $('.wm-toc-li').on('click',  function(e) {
    if ($(this).hasClass('wm-current')) { e.preventDefault(); }
  });
  $('.wm-toc-pane').on('click', '.wm-toc-opener', function(e) {
    if ($(this).hasClass('wm-current')) { e.preventDefault(); }
    $(this).toggleClass('wm-toc-open');
    $(this).next('.wm-toc-li-nested').collapse('toggle');
  });
  $('.wm-toc-pane').on('click', '.wm-page-toc-opener', function(e) {
    // Ignore clicks while transitioning.
    if ($(this).hasClass('wm-current')) { e.preventDefault(); }
    if ($(this).next('.wm-page-toc').hasClass('collapsing')) { return; }
    showPageToc = !showPageToc;
    $(this).toggleClass('wm-page-toc-open', showPageToc);
    $(this).next('.wm-page-toc').collapse(showPageToc ? 'show' : 'hide');
  });

  // Initialize search functionality.
  initSearch();

  // Other initialization of contents.
  initHighlighting();
  
  $('table').addClass('table table-striped table-hover table-bordered table-condensed');
  let m = mainWindow.location.href.match(/(#[\w-_]+)$/g);
  if(m && m[0]) {
    document.querySelector(m[0]).scrollIntoView();
  }
}

function getTocLi(url) {
  var relPath = getRelPath(url);
  var selector = '.wm-article-link[href="' + relPath + '"]';
  //console.log(selector)
  return $(selector).closest('.wm-toc-li');
}

/**
 * Hides a bootstrap collapsible element, and removes it from DOM once hidden.
 */
function collapseAndRemove(collapsibleElem) {
  if (!collapsibleElem.hasClass('in')) {
    // If the element is already hidden, just remove it immediately.
    collapsibleElem.remove();
  } else {
    collapsibleElem.on('hidden.bs.collapse', function() {
      collapsibleElem.remove();
    })
    .collapse('hide');
  }
}

function renderPageToc(parentElem, pageUrl, pageToc) {
  if (!pageToc)
    return;
  
  var ul = $('<ul class="wm-toctree">');
  var depthLevel = 0;
  
  function addItem(tocItem) {
    ul.append($(`<li class="wm-toc-li wm-toc-page-li-level-${depthLevel}">`)
      .append($('<a class="wm-article-link wm-page-toc-text">')
        .attr('href', pageUrl + tocItem.url)
        .text(tocItem.title)));
    if (tocItem.children) {
      depthLevel += 1;
      tocItem.children.forEach(addItem);
      depthLevel -= 1;
    }
  }
  var moreThanOneElem = (pageToc.length > 1 || (pageToc.length && pageToc[0].children && pageToc[0].children.length));
  if (moreThanOneElem) {
    pageToc.forEach(addItem);
  }

  $('.wm-page-toc-opener').removeClass('wm-page-toc-opener wm-page-toc-open');
  collapseAndRemove($('.wm-page-toc'));

  if (moreThanOneElem) {
    parentElem.addClass('wm-page-toc-opener');
  }
  setTimeout(() => {
    parentElem.toggleClass('wm-page-toc-open', showPageToc);
    $('<li class="wm-page-toc wm-toc-li-nested collapse">').append(ul).insertAfter(parentElem)
      .collapse(showPageToc ? 'show' : 'hide');
  }, 100);
}

$(document).ready(function() {
  initMainWindow();
});

var searchIndexReady = false;

/**
 * Initialize search functionality.
 */
function initSearch() {
  // Create elasticlunr index.
  searchIndex = elasticlunr(function() {
    this.setRef('location');
    this.addField('title');
    this.addField('text');
  });

  var searchBox = $('#mkdocs-search-query');
  var searchResults = $('#mkdocs-search-results');

  // Fetch the prebuilt index data, and add to the index.
  $.getJSON(base_url + '/search/search_index.json')
  .done(function(data) {
    data.docs.forEach(function(doc) {
      searchIndex.addDoc(doc);
    });
    searchIndexReady = true;
    $(document).trigger('searchIndexReady');
  });

  function showSearchResults(optShow) {
    var show = (optShow === false ? false : Boolean(searchBox.val()));
    if (show) {
      doSearch({
        resultsElem: searchResults,
        query: searchBox.val(),
        snippetLen: 100,
        limit: 10
      });
    }
    searchResults.parent().toggleClass('open', show);
    return show;
  }

  searchBox.on('click', function(e) {
    if (!searchResults.parent().hasClass('open')) {
      if (showSearchResults()) {
        e.stopPropagation();
      }
    }
  });

  // Search automatically and show results on keyup event.
  searchBox.on('keyup', function(e) {
    var show = (e.which !== Keys.ESCAPE && e.which !== Keys.ENTER);
    showSearchResults(show);
  });

  // Open the search box (and run the search) on up/down arrow keys.
  searchBox.on('keydown', function(e) {
    if (e.which === Keys.UP || e.which === Keys.DOWN) {
      if (showSearchResults()) {
        e.stopPropagation();
        e.preventDefault();
        setTimeout(function() {
          searchResults.find('a').eq(e.which === Keys.UP ? -1 : 0).focus();
        }, 0);
      }
    }
  });

  searchResults.on('keydown', function(e) {
    if (e.which === Keys.UP || e.which === Keys.DOWN) {
      if (searchResults.find('a').eq(e.which === Keys.UP ? 0 : -1)[0] === e.target) {
        searchBox.focus();
        e.stopPropagation();
        e.preventDefault();
      }
    }
  });

  $(searchResults).on('click', '.search-all', function(e) {
    e.stopPropagation();
    e.preventDefault();
    $('#wm-search-form').trigger('submit');
  });

  // Redirect to the search page on Enter or button-click (form submit).
  $('#wm-search-form').on('submit', function(e) {
    var url = this.action + '?' + $(this).serialize();
    visitUrl(url, e);
    searchResults.parent().removeClass('open');
  });

  $('#wm-search-show,#wm-search-go').on('click', function(e) {
    if (isSmallScreen()) {
      e.preventDefault();
      var el = $('#mkdocs-search-query').closest('.wm-top-tool');
      el.toggleClass('wm-top-tool-expanded');
      if (el.hasClass('wm-top-tool-expanded')) {
        setTimeout(function() {
          $('#mkdocs-search-query').focus();
          showSearchResults();
        }, 0);
        $('#mkdocs-search-query').focus();
      }
    }
  });
}

function escapeRegex(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * This helps construct useful snippets to show in search results, and highlight matches.
 */
function SnippetBuilder(query) {
  var termsPattern = elasticlunr.tokenizer(query).map(escapeRegex).join("|");
  this._termsRegex = termsPattern ? new RegExp(termsPattern, "gi") : null;
}

SnippetBuilder.prototype.getSnippet = function(text, len) {
  if (!this._termsRegex) {
    return text.slice(0, len);
  }

  // Find a position that includes something we searched for.
  var pos = text.search(this._termsRegex);
  if (pos < 0) { pos = 0; }

  // Find a period before that position (a good starting point).
  var start = text.lastIndexOf('.', pos) + 1;
  if (pos - start > 30) {
    // If too long to previous period, give it 30 characters, and find a space before that.
    start = text.lastIndexOf(' ', pos - 30) + 1;
  }
  var rawSnippet = text.slice(start, start + len);
  return rawSnippet.replace(this._termsRegex, '<b>$&</b>');
};

/**
 * Search the elasticlunr index for the given query, and populate the dropdown with results.
 */
function doSearch(options) {
  var resultsElem = options.resultsElem;
  resultsElem.empty();

  // If the index isn't ready, wait for it, and search again when ready.
  if (!searchIndexReady) {
    resultsElem.append($('<li class="disabled"><a class="search-link">SEARCHING...</a></li>'));
    $(document).one('searchIndexReady', function() { doSearch(options); });
    return;
  }

  var query = options.query;
  var snippetLen = options.snippetLen;
  var limit = options.limit;

  if (query === '') { return; }

  var results = searchIndex.search(query, {
    fields: { title: {boost: 10}, text: { boost: 1 } },
    expand: true,
    bool: "AND"
  });

  var snippetBuilder = new SnippetBuilder(query);
  if (results.length > 0){
    var len = Math.min(results.length, limit || Infinity);
    for (var i = 0; i < len; i++) {
      var doc = searchIndex.documentStore.getDoc(results[i].ref);
      var snippet = snippetBuilder.getSnippet(doc.text, snippetLen);
      resultsElem.append(
        $('<li>').append($('<a class="search-link">').attr('href', pathJoin(base_url, doc.location))
          .append($('<div class="search-title">').text(doc.title))
          .append($('<div class="search-text">').html(snippet)))
      );
    }
    //resultsElem.find('a').each(function() { adjustLink(this); });
    /*
    if (limit) {
      resultsElem.append($('<li role="separator" class="divider"></li>'));
      resultsElem.append($(
        '<li><a class="search-link search-all" href="' + base_url + '/search.html">' +
        '<div class="search-title">SEE ALL RESULTS</div></a></li>'));
    }
    */
  } else {
    resultsElem.append($('<li class="disabled"><a class="search-link">NO RESULTS FOUND</a></li>'));
  }
}

function pathJoin(prefix, suffix) {
  var nPrefix = endsWith(prefix, "/") ? prefix.slice(0, -1) : prefix;
  var nSuffix = startsWith(suffix, "/") ? suffix.slice(1) : suffix;
  return nPrefix + "/" + nSuffix;
}
