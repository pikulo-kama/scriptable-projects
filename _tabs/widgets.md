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

#### Widget States

![Widget image with schedules for today](assets/blackout_notifier/schedule-preview.jpg){: .left .widget-image }
_With today schedule_
In this widget state you can see two blocks, first contains location for which schedule is displayed
and the second one shows list of daily outage range scheduled for today.

Each record contains outage identifier and actual hour range.\
Outage identifier is a numeric icon that shows ordering in which outages would be
applied, the only exception is when outage is probable (meaning that it's not 100% that it will occurr)
for this type of outages identificator is yellow question mark icon.

Hour Ranges only support 24 hour format.
{: .pb-5 }

![Widget image with indicator that notifies that tomorrow schedule is available](assets/blackout_notifier/tomorrow-schedule-avail-preview.jpg){: .right .widget-image }
_With tomorrow schedule_
This state is not much different from the previous one, except in this state below location block you can see an indicator.
This indicator is visible only if there are schedules for tomorrow available.

Color of the indicator dot may vary, if tomorrow schedule is available and there are outages then color would be red.
If tomorrow schedule is available but at the moment there are no outages planned then color would be green.
{: .pb-5 }

![Widget when no schedules are available](assets/blackout_notifier/no-schedule-preview.jpg){: .left .widget-image }
_With no schedule for today_
This state is displayed when there are no outages in today schedule. When no outages in today's schedule then large
yellow light bulb placeholder image would be displayed.

As you can see even if there are no outages for today, tomorrow schedule indicator would still be displayed if
tomorrow schedule is available.
{: .pb-5 }

![Widget when there is no connection](assets/blackout_notifier/no-connection-preview.jpg){: .right .widget-image }
_When no Internet connection_
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

Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.

The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham

{% include script_doc.html
    name="New Episode Tracker"

    widgetSupport=true
    widgetSize="medium"
    widgetPreview="assets/new_episode_tracker/series-countdown-preview.jpg"
%}

Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.

The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham

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

Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.

The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham

{% include script_doc.html
    name="WatchQ"

    widgetSupport=true
    widgetSize="small"
    widgetPreview="assets/watchq/watchlist-not-empy-preview.jpg"

    uiTableSupport=true
    uiTableReadonly=true
    uiTablePreview="assets/watchq/table-preview.jpg"
%}

Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.

The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham


## Internal Scripts

{% include script_doc.html
    name="Feature UI"

    uiTableSupport=true
    uiTableAllowCreation=true
    uiTableAllowEditing=true
    uiTableAllowDeletion=true
    uiTablePreview="assets/feature_ui/table-preview.jpg"
%}

Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.

The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham

{% include script_doc.html
    name="Localizator"

    uiTableSupport=true
    uiTableAllowEditing=true
    uiTablePreview="assets/localizator/table-preview.jpg"
%}

Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.

The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham

{% include script_doc.html
    name="Bundler"
%}

Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.

The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham

{% include script_doc.html
    name="Logger UI"

    uiTableSupport=true
    uiTableAllowCreation=true
    uiTableAllowEditing=true
    uiTableAllowDeletion=true
    uiTablePreview="assets/logger_ui/table-preview.jpg"
%}

Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.

The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham