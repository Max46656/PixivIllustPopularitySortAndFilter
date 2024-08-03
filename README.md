# 現已將此腳本移至[EverythingInGreasyFork](https://github.com/Max46656/EverythingInGreasyFork/)中管理。

# PixivIllustPopularitySortAndFilter
Sort Illustration by likes and display only those above the threshold on followed artist illustrations,
artist illustrations, and tag illustrations pages.

## Features
Use strategy pattern to adapt to different page settings and layouts.
* Sorting by number of likes.
* Displaying thresholds for number of likes.
* Resetting thresholds and display illustration again.
* Returning to the number of pages before sorting.
* Setting the number of columns in the work table.
* Added fool-proof design, no errors will appear on the last page.

## Installation
1. Install Tampermonkey (Firefox, Chrome, Vivaldi)
2. Install [Pixiv Illustration Popularity Sort & Filter](https://greasyfork.org/zh-TW/scripts/497015-pixiv%E4%BD%9C%E5%93%81%E7%86%B1%E9%96%80%E7%A8%8B%E5%BA%A6%E6%8E%92%E5%BA%8F%E8%88%87%E7%AF%A9%E9%81%B8%E5%99%A8) (will load in userscript manager installed above)
3. Done

## Usage
1. Click on the Tampermonkey menu and locate this script.
2. In Pixiv page,Set the number of pages processed and the favorite threshold.
3. StartButton will prompt you with the favorite threshold and the number of pages processed.
4. Click "GO!".

## Notes
* This script uses Pixiv's dynamic loading mechanism, so you need to keep the Pixiv page in view.
* Do not open developer tools or resize the window during the script's execution.
  Doing so may prevent some thumbnails from loading, causing the script to get stuck until it captures all thumbnails on the page.

## Notes
* This script uses Pixiv's dynamic loading mechanism, so you need to keep the Pixiv page in view.
* Do not open developer tools or resize the window during the script's execution.
  Doing so may prevent some thumbnails from loading, causing the script to get stuck until it captures all thumbnails on the page.

## F&Q
* Why not use the same API to get thumb?
Use API to get thumb will hit the API access limit and require an interval(or at least some kind of error).
Several methods have been tried so far, but none of them are as stable or fast as using Pixiv's built-in mechanism.
