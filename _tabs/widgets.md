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
    widgetPreview="assets/blackout_notifier/schedule-preview.jpg"
%}

#### Widget Description

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
2. Parameter - *City*,*Street*,*Building* (e.g. Івано-Франківськ,Стуса,10)
{: .pb-3 }

#### Running from widget

When you run script by clicking on a widget, OE chart would be displayed in Scriptable
showing today's and tomorrow's schedule (if available).
{: .pb-3 }

#### Widget States

![Widget image with schedules for today](assets/blackout_notifier/schedule-preview.jpg){: .left .widget-small-image }
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

![Widget image with indicator that notifies that tomorrow schedule is available](assets/blackout_notifier/tomorrow-schedule-avail-preview.jpg){: .right .widget-small-image }
_Tomorrow's schedule available_
This state is not much different from the previous one, except in this state below location block you can see an indicator.
This indicator is visible only if there are schedules for tomorrow available.

Color of the indicator dot may vary, if tomorrow schedule is available and there are outages then color would be red.
If tomorrow schedule is available but at the moment there are no outages planned then color would be green.
{: .pb-5 }

![Widget when no schedules are available](assets/blackout_notifier/no-schedule-preview.jpg){: .left .widget-small-image }
_Today's schedule has not outages_
This state is displayed when there are no outages in today schedule. When no outages in today's schedule then large
yellow light bulb placeholder image would be displayed.

As you can see even if there are no outages for today, tomorrow schedule indicator would still be displayed if
tomorrow schedule is available.
{: .pb-5 }

![Widget when there is no connection](assets/blackout_notifier/no-connection-preview.jpg){: .right .widget-small-image }
_Internet connection not available_
This state is displayed mainly when there are no internet connection on user's device in this case
placeholder showed on image would be displayed to the user.

This state may also be triggered when OE website is not available.
{: .pb-5 }

{% include script_doc.html
    name="Customer Chart"

    widgetSupport=true
    widgetSize="medium"
    widgetPreview="assets/customer_chart/chart-preview.jpg"
%}

#### Widget Description

If you want to have a summary of events then this widget is what you need.
It reads calendar events and plots them on linear chart widget.
{: .pb-3 }

#### Widget Configuration

1. When Interacting - *any*
2. Parameter - {"calendar": "Calendar", "period", 6, "mode": "dark", "trimBlank": true}
    - *calendar* - name of calendar from which events should be read.
    - *period* - amount of months that should be plotted.
    - *mode* - theme, could be either **dark** or **light**.
    - *trimBlank* - useful when plotting events from old calendars that didn't have any events in
    recent months. When set to **true** will skip all latest months with no events.

{% include script_doc.html
    name="New Episode Tracker"

    widgetSupport=true
    widgetSize="medium"
    widgetPreview="assets/new_episode_tracker/series-countdown-preview.jpg"
%}

#### Widget Description

If you like to follow releases of new episodes of your favorite series 
then this widget is exactly what you need. Widget uses [Episodate Open API](https://www.episodate.com/)
to obtain series information.

#### Widget Configuration

1. When Interacting - *any*
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
losses resulting from exceeding API usage limit.
{: .prompt-warning }

In case if you don't want to use Google Vision API you can just avoid this step, in cases when API key is
invalid fallback dominant color would be used, which could be configured through `.fallbackDominantColor` feature.

#### Widget States

![Widget image with next episode countdown available](assets/new_episode_tracker/series-countdown-preview.jpg){: .left .widget-medium-image }
_Countdown is available_
First of all you can see several key elements, series thumbnail, title, countdown to the next episode as well as identificator of the
season/episode that should be released and also date on which episode would air.

Countdown block displays amount of time that is left before next episode would be released.
{: .pb-5 }

![Widget image when next episode countdown is not available](assets/new_episode_tracker/series-no-countdown-preview.jpg){: .right .widget-medium-image }
_Countdown is not available_
In this state you can see that countodwn block is slightly different, it displays icon of hourglass instead of actual countdown
this screen is displayed in scenarios when there is no information on when next episode would air. Block below countdown in this state
displays information about last available episode.
{: .pb-5 }

![Widget image when series has already ended](assets/new_episode_tracker/series-completed-preview.jpg){: .left .widget-medium-image }
_Series has ended_
This state has similar behavior when compared to the previous state. This one is displayed when series has already finished and
no new episode would air for the series. Block below the countdown here also displays information about last available episode, which
is basically last episode of the series.
{: .pb-5 }

{% include script_doc.html
    name="Stop Watcher"

    widgetSupport=true
    widgetSize="small"
    widgetPreview="assets/stop_watcher/episode-started-preview.jpg"

    uiTableSupport=true
    uiTableAllowCreation=true
    uiTableAllowEditing=true
    uiTableAllowDeletion=true
    uiTableAllowFiltering=true
    uiTablePreview="assets/stop_watcher/table-preview.jpg"
%}

#### Widget Description

#### Limitations

#### Widget Configuration

#### Running from widget

#### Widget States

{% include script_doc.html
    name="WatchQ"

    widgetSupport=true
    widgetSize="small"
    widgetPreview="assets/watchq/watchlist-not-empy-preview.jpg"

    uiTableSupport=true
    uiTableReadonly=true
    uiTablePreview="assets/watchq/table-preview.jpg"
%}

#### Widget Description

#### Limitations

#### Widget Configuration

#### Running from widget

#### Widget States


## Internal Scripts

{% include script_doc.html
    name="Feature UI"

    uiTableSupport=true
    uiTableAllowCreation=true
    uiTableAllowEditing=true
    uiTableAllowDeletion=true
    uiTablePreview="assets/feature_ui/table-preview.jpg"
%}

#### Widget Description

#### Limitations

#### Widget Configuration

#### Running from widget

#### Widget States

{% include script_doc.html
    name="Localizator"

    uiTableSupport=true
    uiTableAllowEditing=true
    uiTablePreview="assets/localizator/table-preview.jpg"
%}

#### Widget Description

#### Limitations

#### Widget Configuration

#### Running from widget

#### Widget States

{% include script_doc.html
    name="Bundler"
%}

#### Widget Description

#### Limitations

#### Widget Configuration

#### Running from widget

#### Widget States

{% include script_doc.html
    name="Logger UI"

    uiTableSupport=true
    uiTableAllowCreation=true
    uiTableAllowEditing=true
    uiTableAllowDeletion=true
    uiTablePreview="assets/logger_ui/table-preview.jpg"
%}

#### Widget Description

#### Limitations

#### Widget Configuration

#### Running from widget

#### Widget States