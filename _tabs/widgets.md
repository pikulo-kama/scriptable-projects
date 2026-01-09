---
layout: post
title: Widgets and UI Tables
description: Contains documentation about end-user scripts, such as widgets and UI tables.
categories: [Blogging, Documentation]
icon: fa fa-tree
order: 2
toc: true
---

## User-Facing Scripts

The following section contains list of scripts that could be used directly by end-user.\
Some scripts have only UI table functionality implemented, but some of them have both Widget and UI table.

{% include script_doc.html
name="Blackout Notifier"
specificity="uk"

    widgetSupport=true
    widgetSize="small"
    widgetPreview="assets/img/blackout_notifier/schedule-preview.jpg"

%}

#### Script Description

This widget is usable for Ukrainians due to frequent power outages, widget may benefit you
by allowing you to see daily outage schedule right on your phone home page.
Hour Ranges only support 24 hour format.
{: .pb-3 }

#### Limitations

Currently only **Ivano Frankivsk** OE website is supported.
If you wish new region to be supported raise an issue in [widgets repository](https://github.com/pikulo-kama/scriptable-projects).
{: .pb-3 }

#### Widget Configuration

1. When interacting - **Run Script**
2. Parameter - _City_,_Street_,_Building_ (e.g. Івано-Франківськ,Стуса,10)
   {: .pb-3 }

#### Running from widget

When you run script by clicking on a widget, OE chart would be displayed in Scriptable
showing today's and tomorrow's schedule (if available).
{: .pb-3 }

#### Widget States

![Widget image with schedules for today](assets/img/blackout_notifier/schedule-preview.jpg){: .left .widget-small-image }
_Today's schedule available_
In this widget state you can see two blocks, first contains location for which schedule is displayed
and the second one shows list of daily outage range scheduled for today.

Each record contains outage identifier and actual hour range.\
Outage identifier is a numeric icon that shows ordering in which outages would be
applied, the only exception is when outage is probable (meaning that it's not 100% that it will occurr)
for this type of outages identificator is yellow question mark icon.

If outage has already passed it would be semi transparent, in this example current hour is 17:00 which means that
first two outages are already in the past.
{: .pb-5 }

![Widget image with indicator that notifies that tomorrow schedule is available](assets/img/blackout_notifier/tomorrow-schedule-avail-preview.jpg){: .right .widget-small-image }
_Tomorrow's schedule available_
This state is not much different from the previous one, except in this state below location block you can see an indicator.
This indicator is visible only if there are schedules for tomorrow available.

Color of the indicator dot may vary, if tomorrow schedule is available and there are outages then color would be red.
If tomorrow schedule is available but at the moment there are no outages planned then color would be green.
{: .pb-5 }

![Widget when no schedules are available](assets/img/blackout_notifier/no-schedule-preview.jpg){: .left .widget-small-image }
_Today's schedule has not outages_
This state is displayed when there are no outages in today schedule. When no outages in today's schedule then large
yellow light bulb placeholder image would be displayed.

As you can see even if there are no outages for today, tomorrow schedule indicator would still be displayed if
tomorrow schedule is available.
{: .pb-5 }

![Widget when there is no connection](assets/img/blackout_notifier/no-connection-preview.jpg){: .right .widget-small-image }
_Internet connection not available_
This state is displayed mainly when there are no internet connection on user's device in this case
placeholder showed on image would be displayed to the user.

This state may also be triggered when OE website is not available.
{: .pb-5 }

{% include script_doc.html
name="Customer Chart"

    widgetSupport=true
    widgetSize="medium"
    widgetPreview="assets/img/customer_chart/chart-preview.jpg"

%}

#### Script Description

If you want to have a summary of events then this widget is what you need.
It reads calendar events and plots them on linear chart widget.
{: .pb-3 }

#### Widget Configuration

1. When Interacting - _any_
2. Parameter - {"calendar": "Calendar", "period", 6, "mode": "dark", "trimBlank": true}
   - _calendar_ - name of calendar from which events should be read.
   - _period_ - amount of months that should be plotted.
   - _mode_ - theme, could be either **dark** or **light**.
   - _trimBlank_ - useful when plotting events from old calendars that didn't have any events in
     recent months. When set to **true** will skip all latest months with no events.

{% include script_doc.html
name="New Episode Tracker"

    widgetSupport=true
    widgetSize="medium"
    widgetPreview="assets/img/new_episode_tracker/series-countdown-preview.jpg"

%}

#### Script Description

If you like to follow releases of new episodes of your favorite series
then this widget is exactly what you need. Widget uses [Episodate Open API](https://www.episodate.com/)
to obtain series information.

#### Widget Configuration

1. When Interacting - _Run Script_
2. Parameter - series ID from Episodate API (e.g. round-six)

#### How to obtain series ID

1. Open [Episodate website](https://www.episodate.com/).
2. Search for the desired series (e.g. Squid Game).
3. In search results screen select series that you wish to add to widget.
4. Once series page has loaded take a look at the URL.
5. Copy part of URL after '../tv-show/' this is your series ID (e.g. https://www.episodate.com/tv-show/**round-six**).

#### Google Vision API Integration

Widget uses Google Vision API to get dominant color for the series which can be seen behind the series image and as background
of countdown block. To be able to use the API you need to create a Google API key and put it into `~/Resources/New Episode Tracker/google_vision_api_key.txt`.

Be aware that API is public but has limitations, you only have 1000 requests that you can send for free in month. After widget has obtained dominant
color for the series it will store it in resources of the script for later use.

> Be aware that developer of this widget doesn't take any responsibility for any financial
> losses resulting from exceeding API usage limit.
> {: .prompt-warning }

In case if you don't want to use Google Vision API you can just avoid this step, in cases when API key is
invalid fallback dominant color would be used, which could be configured through `.fallbackDominantColor` feature.

#### Rerolling Dominant Color

If you're using Google Vision API script will request three dominant colors and then pick random from the list,
if you're not satisfied with the color you can reroll it by enabling `rerollColor` feature. After enabling click on the widget you want
to change color for, once color satisfies you make sure to turn off `rerollColor` feature.

#### Widget States

![Widget image with next episode countdown available](assets/img/new_episode_tracker/series-countdown-preview.jpg){: .left .widget-medium-image }
_Countdown is available_
First of all you can see several key elements, series thumbnail, title, countdown to the next episode as well as identificator of the
season/episode that should be released and also date on which episode would air.

Countdown block displays amount of time that is left before next episode would be released.
{: .pb-5 }

![Widget image when next episode countdown is not available](assets/img/new_episode_tracker/series-no-countdown-preview.jpg){: .right .widget-medium-image }
_Countdown is not available_
In this state you can see that countodwn block is slightly different, it displays icon of hourglass instead of actual countdown
this screen is displayed in scenarios when there is no information on when next episode would air. Block below countdown in this state
displays information about last available episode.
{: .pb-5 }

![Widget image when series has already ended](assets/img/new_episode_tracker/series-completed-preview.jpg){: .left .widget-medium-image }
_Series has ended_
This state has similar behavior when compared to the previous state. This one is displayed when series has already finished and
no new episode would air for the series. Block below the countdown here also displays information about last available episode, which
is basically last episode of the series.
{: .pb-5 }

{% include script_doc.html
name="Stop Watcher"

    widgetSupport=true
    widgetSize="small"
    widgetPreview="assets/img/stop_watcher/episode-started-preview.jpg"

    uiTableSupport=true
    uiTableAllowCreation=true
    uiTableAllowEditing=true
    uiTableAllowDeletion=true
    uiTableAllowFiltering=true
    uiTablePreview="assets/img/stop_watcher/table-preview.jpg"

%}

#### Script Description

If you enjoy watching series and always forget place where
you left off then this widget might just be for you. You can add
series to the widget and keep track of the season, episode and timecode
you're watching currently.

#### UI Table Structure

- **Status**\
  _Whether you are still watching series or have already finished it and waiting for next season._ - Could be either 'Done' or 'In-progress' - If status is 'Done' then series/episode and timecode fields would be hidden
- **WatchQ Integration Field**\
  _This field should be used if you want to use WatchQ along with Stop Watcher_ - Has series ID field (see <a href="#how-to-obtain-series-id">how to obtain series ID section</a>) - Has action to toggle visibility of series in WatchQ widget (would still be visible in UI table if toggle if OFF)
- **Series Name**\
  _Name of the series, you can put anything you want here_ - Value of this field is used to as parameter for the widget
- **Season/Episode**\
  _Used to update season and episode of the series_ - Has Season form field - Has Episode form field - Has action to update episode number by one - Each time season or episode is updated - timecode would reset
- **Timecode**\
  _Used to update timecode where you left off watching_ - Contains hours and minutes sliders
- **Delete field**\
  _Generic delete field used to remove series from table_
  {: .pb-3 }

#### Widget Configuration

1. When interacting - **Run Script**
2. Parameter - _%Series Name from UI table%_
   {: .pb-3 }

#### Running from widget

Running script from widget will open UI table where you can view and update series information.

#### Widget States

![Widget image when episode was partially watched](assets/img/stop_watcher/episode-started-preview.jpg){: .left .widget-small-image }
_Episode partially watched_
There are several blocks you can see, such as series title, block with timecode of the episode as well as season/episode tag.
<br><br><br>
{: .pb-5 }

![Widget image when episode was not watched](assets/img/stop_watcher/episode-not-started-preview.jpg){: .right .widget-small-image }
_Episode not watched_
As you can see this state is not much different from the previous one, except here you can see that timecode block displays 'TBW' which
stands for 'To be watched'.
<br><br><br>
{: .pb-5 }

![Widget image when series has Ended status](assets/img/stop_watcher/watched-preview.jpg){: .left .widget-small-image }
_Series has ended status_
In this state both timecode block and season/episode tag block contain question mark placeholder.
<br><br><br><br><br>
{: .pb-5 }

{% include script_doc.html
name="WatchQ"

    widgetSupport=true
    widgetSize="small"
    widgetPreview="assets/img/watchq/watchlist-not-empty-preview.jpg"

    uiTableSupport=true
    uiTableReadonly=true
    uiTablePreview="assets/img/watchq/table-preview.jpg"

%}

#### Script Description

Widget should be only used together with <a href="#stop-watcher">Stop Watcher</a> widget
it will pull series with serie ID set as well as information where you left of and will pull
datat from Scriptable API to calculate how many episodes is left for you to watch.

#### UI Table Structure

- **Series Name**\
  _Name of the series that you haven't finished yet_
- **Episode Count**\
  _Amount of episodes that you still need to watch in order to catch up_

#### UI Table Notices

- **Hidden Series Summary**\
  _This notice contains summary on how many series and episodes in total are not being shown in UI table
  and not being displayed in widget. Only series that have unwatched episodes but have **WatchQ visibility turned off**
  in Stop Watcher are not shown._

#### Widget Configuration

1. When Interacting - **Run Script**
2. Parameter - No parameters

#### Running from widget

When running script from widget UI table with detailed
list of how much episodes for each of the series have left to watch.

#### Widget States

![Widget image not empty watchlist](assets/img/watchq/watchlist-not-empty-preview.jpg){: .left .widget-small-image }
_Watchlist is not emtpy_
In this state widget contains total amount of episodes from all series that you still need to watch.
<br><br>
{: .pb-5 }

![Widget image empty watchlist](assets/img/watchq/watchlist-empty-preview.jpg){: .right .widget-small-image }
_Watchlist is empty_
This state is triggered when there are no new episodes for the series from Stop Watcher that you can watch.
<br><br><br><br>
{: .pb-5 }

## Internal Scripts

{% include script_doc.html
  name="Script Installer"
  optionSelectionSupport=true
  optionSelectionPreview="assets/img/script_installer/dropdown-preview.jpg"
%}

#### Script Description

The Script Installer acts as a bridge between the remote GitHub repository and your local Scriptable environment. It automates the process of fetching the latest project files, bundling dependencies on the fly, and synchronizing localized resources and feature flags. It effectively serves as a custom "package manager" for your private or public Scriptable tools.

#### Limitations

- **GitHub API Rate Limits**: The script uses a 24-hour cache for repository tree requests to avoid hitting GitHub's rate limits (60 requests per hour for unauthenticated users).
- **Base64 Overhead**: Files are fetched as GitHub "blobs" in Base64 format. Large binary assets may take longer to process and convert.
- **Temporary Storage**: The script requires enough local storage to hold a full clone of the repository metadata and files before it extracts the specific script you requested.

{% include script_doc.html
name="Feature UI"
    uiTableSupport=true
    uiTableAllowCreation=true
    uiTableAllowEditing=true
    uiTableAllowDeletion=true
    uiTablePreview="assets/img/feature_ui/table-preview.jpg"
%}

#### Script Description

The Feature UI script is a management tool for Scriptable developers to toggle and configure feature flags (or "debug configurations") for other scripts within the project. It provides a visual CRUD (Create, Read, Update, Delete) interface to manage feature states without manually editing JSON files. It supports three data types: Boolean, String, and Number, and includes logic to handle "Config Features" (system-level flags) that cannot be disabled.

If triggered from a widget, the script will attempt to present a Modal for script selection. However, for the best experience:

1. Open the Scriptable App.
2. Run Feature UI.
3. Select the target script from the prompted list.
4. Interact with the Data Table to modify features.

#### Limitations

- **Debug Feature**: Debug feature of a script should always have a name _\_\_debug_ and be of boolean type.
- **Directory Dependency**: The script relies on the Files module to find directories that specifically contain feature configuration files.
- **Number Validation**: Numeric features must be positive numbers; otherwise, they revert to a fallback value (123).
- **Boolean Restrictions**: Boolean features cannot hold an additional string/number value; they only respect the Enabled/Disabled state.
- **Protected Flags**: Features starting with a dot (.) are treated as configuration indicators and their "Enabled" state is locked to true.

{% include script_doc.html
name="Localizator"

    uiTableSupport=true
    uiTableAllowEditing=true
    uiTablePreview="assets/img/localizator/table-preview.jpg"

%}

#### Script Description

The Localizator script is a utility designed to simplify the localization process for Scriptable projects. It automatically detects the user's system language and provides a tabular interface to translate keys from a primary script. It handles the synchronization between the default English (en) locale and the target language, ensuring that any missing keys in the target locale are populated from the default template.

This script is intended for use within the Scriptable App to allow for keyboard input and modal interaction. It is not compatible with Home Screen widget execution.

#### Limitations

- **Language Detection**: It identifies the target language based on the primary language of the device (e.g., "fr" from "fr-FR").
- **Key Format**: It assumes a specific naming convention (e.g., prefix_camelCaseKey) to accurately transform technical keys into readable labels.
- **Template Dependency**: The script requires an existing en.json (or equivalent) in the script's locale directory to act as the source template.

{% include script_doc.html
  name="Bundler UI"
  optionSelectionSupport=true
  optionSelectionPreview="assets/img/bundler_ui/dropdown-preview.jpg"
%}

#### Script Description

The Bundler UI is a distribution utility that converts modular development projects into single-file executables. It recursively scans a script for importModule calls, extracts the code from those dependencies, strips out Scriptable-specific metadata and module.exports blocks, and combines everything into a new file suffixed with` (Bundled)`. This is particularly useful for sharing scripts with users who do not have your entire library of modules installed.

#### Limitations

- **Regex-Based Parsing**: The bundler uses Regular Expressions to find dependencies. It expects standard formatting: `const { ... } = importModule("...");`.
- **Metadata Stripping**: It assumes the first 3 lines of every script are the Scriptable metadata (icon, color, etc.). Only the metadata from the main script is preserved in the final bundle.
- **Flat Scope**: Since it merges files into a single scope, you must ensure there are no variable name collisions between your main script and its dependencies.

{% include script_doc.html
name="Logger UI"

uiTableSupport=true
uiTableAllowCreation=true
uiTableAllowEditing=true
uiTableAllowDeletion=true
uiTablePreview="assets/img/logger_ui/table-preview.jpg"
%}

#### Script Description

The Logger UI script provides a centralized management console for controlling the verbosity of various services within your project. It allows you to define specific log levels (e.g., DEBUG, INFO, WARN) for individual services on the fly. This data is persisted in a levels.json file, which the main Logger module consumes to determine whether a specific log message should be suppressed or displayed.

This script is designed for App Mode only. It utilizes complex table interactions and form actions that are not supported in a standard Home Screen widget.

#### Limitations

- **Global Persistence**: Unlike the <a href="#feature-ui">Feature UI</a>, which is script-specific, this script manages a global levels.json file specifically for the Logger script directory.
- **Predefined Levels**: Users are restricted to the levels defined in the LogLevel enum (OFF, INFO, WARN, ERROR, DEBUG).
- **Service Naming**: Service names are free-text; ensure they match the strings used in your Logger calls within other scripts.
