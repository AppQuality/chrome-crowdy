# Chrome-crowdy

Chrome-crowdy is an extension useful to record debug information about the navigation.

It tracks the following data:
- clicks;
- errors;
- storage variables;
- cookies;
- console logs;
- network events;
- all browser extensions installed.

# Installation

To install the extension:
- download the zip file of the repository;
- extract it in a folder;
- open chrome, and search "chrome://extensions" on the URL bar;
- enable "developer mode";
- click on "load unpacked extension";
- select the folder where you extracted the zip file.

You're ready yo use the extension!

# Usage

Click on the browser action.

First of all, check the information you want to record from the list (N.B: if you select cookies and storage, ALL cookies and storage variables stored in your browser by the domains you will visit will be caught by the extension, so be aware).

Then, click on "Start recording" and do your things.

When you're done, click "Stop recording" and follow the instructions that appear.

You have the possibility to see all the data that have been recorded pressing the button "Show actually recorded JSON" on the top-right of the extension's popup. On this page you can:
- filter the data, hiding some recordings;
- delete some data: press on the bin icon on the right of each ojbect, then click "Delete selected".


If you encounter a bug of the extension, please report it using the bug icon on the bottom-right.

This extension works on the following browsers:
- Chrome;
- Edge.