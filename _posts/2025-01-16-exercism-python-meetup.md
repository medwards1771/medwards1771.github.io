---
layout: post
title:  "Solving meetup on Exercism in Python"
date:   2025-01-16
---

## Purpose + motivation

See the [Purpose and motivation section](https://medwards1771.github.io/2025/01/14/exercism-python-raindrops.html) from an earlier post in this series.

## The Problem

### Title: Meetup

### Difficulty Level: Medium

### Easter egg hunt: find the reference to Kamala Harris

### Description

(Taken directly from Exercism's [website](https://exercism.org/tracks/python/exercises/meetup)):
Your task is to find the exact date of a meetup, given a month, year, weekday and week. There are six week values to consider: first, second, third, fourth, last, teenth. For example, you might be asked to find the date for the meetup on the first Monday in January 2018 (January 1, 2018).

Similarly, you might be asked to find:

the third Tuesday of August 2019 (August 20, 2019)\
the teenth Wednesday of May 2020 (May 13, 2020)\
the fourth Sunday of July 2021 (July 25, 2021)\
the last Thursday of November 2022 (November 24, 2022)\
the teenth Saturday of August 1953 (August 15, 1953)\

The teenth week refers to the seven days in a month that end in '-teenth' (13th, 14th, 15th, 16th, 17th, 18th and 19th).

## Method interface

```py
def meetup(year, month, week_type, weekday):
    # returns date object for date that matches parameters
```

## First Solution: get it to work

My first solution follows an object-oriented approach. In addition to the provided `MeetupDayException`, I define `Year`, `Month`, `Week`, and `MeetupDay` classes:

```py
class MeetupDayException(ValueError):
    def __init__(self, message):
       super().__init__(message)

import datetime
import calendar

class Year:
    def __init__(self, number):
        self.number = number

    def is_leap(self):
        return calendar.isleap(self.number)

class Month:
    def __init__(self, number, year):
        self.number = number
        self.year = year

    def last_date(self):
        if self.number == 2:
            if self.year.is_leap():
                end_date = 29
            else:
                end_date = 28
        elif self.number in [9, 4, 6, 11]:
            end_date = 30
        else:
            end_date = 31

        return end_date

class Week:
    def __init__(self, type_of_week, month):
        self.type = type_of_week
        self.year = month.year.number
        self.month = month

    def up_to_first_seven_days(self):
        week_start_date = self.start_date()
        distances_from_week_start_date = [0,1,2,3,4,5,6]
        up_to_first_seven = {}
        for distance in distances_from_week_start_date:
            try:
                day_of_the_week = datetime.datetime(self.year, self.month.number, week_start_date + distance).strftime("%A")
                up_to_first_seven[week_start_date + distance] = day_of_the_week
            except:
                break

        return up_to_first_seven

    def start_date(self):
        type_to_start_date_map = {
            "first": 1,
            "second": 8,
            "third": 15,
            "fourth": 22,
            "fifth": 29,
            "teenth": 13,
            "last": self.month.last_date() - 6
        }

        return type_to_start_date_map[self.type]

class MeetupDay:
    def __init__(self, year, month, up_to_first_seven_days_in_week, day_of_week):
        self.year = year
        self.month = month
        self.up_to_first_seven_days_in_week = up_to_first_seven_days_in_week
        self.day_of_week = day_of_week

    def date(self):
        for date_integer, weekday in self.up_to_first_seven_days_in_week.items():
            if weekday == self.day_of_week:
                return datetime.date(self.year, self.month, date_integer)

        raise MeetupDayException("That day does not exist.")


def meetup(year, month, week, day_of_week):
    year_object = Year(year)
    month_object = Month(month, year_object)
    up_to_first_seven_days_in_week = Week(week, month_object).up_to_first_seven_days()

    return MeetupDay(year, month, up_to_first_seven_days_in_week, day_of_week).date()
```

What I like about this approach is the clarity it brings through abstraction. Seems contradictory, so let me explain. Classes aren't necessary for solving this exercise, but they give you the opportunity to add meaning through choices like naming and instantiation parameters. Creating classes for `Year`, `Month`, and `Week` gives you a heads up that there's something important about those values beyond their numeric representation: a year can be a leap year or not; the last date in a month varies based on what month it is and whether the month is in a leap year. Passing `month_object` to instantiate `Week` tells you that week objects have a characteristic that changes depending on the month, while passing `month` as a bare integer to instantiate `MeetupDay` says instances of that class only need to know about a single static characteristic in a month. Even defining the class `Month` with just one method -- `last_date` -- tells you that there's something important about the last date in a month.

## Second Solution: stick with classes, eliminate unnecessary effort

Of course, there are downsides to my first solution. Probably the most glaring is the duplication of effort in building the `week.up_to_seven_days` dict, then looping over that dict in `meetupday.date`:

```py
def up_to_first_seven_days(self):
        week_start_date = self.start_date()
        distance_from_week_start_date = 0
        up_to_first_seven = {}
        while distance_from_week_start_date < self.number_of_days:
            try:
                day_of_the_week = datetime.datetime(self.year, self.month.number, week_start_date + distance_from_week_start_date).strftime("%A")
                up_to_first_seven[week_start_date + distance_from_week_start_date] = day_of_the_week
                distance_from_week_start_date += 1
            except:
                break

        return up_to_first_seven
```

Here, `week_start_date` corresponds to the first day in the type of week. For "first" weeks that's 1, for "second" weeks that's 8, for "teenth" weeks that's 13, etc.

While we're within six days of the week's start (since the seventh day after would get into the following week), I check whether each successive day after the week's start actually exists. If it doesn't, I break and stop adding entries to the `up_to_first_seven` dict. The method returns a dict of varying length depending on how many dates within the week were real. For a week with a start date of 1 on a Tuesday, the dict would look like:

```py
{
    1: "Tuesday",
    2: "Wednesday",
    3: "Thursday",
    4: "Friday",
    5: "Saturday",
    6: "Sunday",
    7: "Monday",
}
```

For a week with a start date of 24 on a Friday in February of a non-leap year, the dict would look like:

```py
{
    24: "Friday",
    25: "Saturday",
    26: "Sunday",
    27: "Monday",
    28: "Tuesday",
}
```

I rely on the nonexistence of un-real dates later, in `meetupday.date`, to figure out whether or not to raise a `MeetupDayException`. But there's extra work here. The problem asks you to return a single date, not all possible dates within a given week type. What if the correct date is the first row in the dict, why keep building out more rows? Also, why have two loops -- one that creates a date-to-weekday map, and another that loops over that map to find the matching weekday?

To eliminate that extra work, I refactored my solution so that a method in the Week class, `date_matching_day_of_week`, takes on the work of finding the matching day in a single loop. This change made it necessary to update the parameters passed to Week on instantiation to include `day_of_week`. Also, now that we have a method that returns the matching date we're looking for (or raises an exception), we'll need to update the work we do in the body of the `meetup` function. Here's the full solution:

```py
import datetime
import calendar

class Year:
    def __init__(self, number):
        self.number = number
    def is_leap(self):
        return calendar.isleap(self.number)

class Month:
    def __init__(self, number, year):
        self.number = number
        self.year = year

    def last_date(self):
        if self.number == 2:
            if self.year.is_leap():
                end_date = 29
            else:
                end_date = 28
        elif self.number in [9, 4, 6, 11]:
            end_date = 30
        else:
            end_date = 31
        return end_date

class Week:
    def __init__(self, type_of_week, month, day_of_week):
        self.type = type_of_week
        self.year = month.year.number
        self.month = month
        self.day_of_week = day_of_week
        self.number_of_days = 7

    def date_matching_day_of_week(self):
        week_start_date = self.start_date()
        distance_from_week_start_date = 0
        while distance_from_week_start_date < self.number_of_days:
            try:
                date_integer = week_start_date + distance_from_week_start_date
                date = datetime.datetime(self.year, self.month.number, date_integer).strftime("%A")
            except:
                raise MeetupDayException("That day does not exist.")
            if date == self.day_of_week:
                return date_integer
            else:
                distance_from_week_start_date += 1

    def start_date(self):
        type_to_start_date_map = {
            "first": 1,
            "second": 8,
            "third": 15,
            "fourth": 22,
            "fifth": 29,
            "teenth": 13,
            "last": self.month.last_date() - 6
        }
        return type_to_start_date_map[self.type]

def meetup(year, month, week, day_of_week):
    year_object = Year(year)
    month_object = Month(month, year_object)
    date_matching_day_of_week = Week(week, month_object, day_of_week).date_matching_day_of_week()
    return datetime.date(year, month, date_matching_day_of_week)
```

Notice that I eliminated the `MeetupDay` class. I could have encapsulated the `datetime.date(year, month, date_matching_day_of_week)` work in `MeetupDay`, but decided not to since we already have the `meetup` function as a context-granting interface. This gives `Week` objects the responsibility for figuring out the matching date, which seems a little strange at first but makes sense when you consider that the date match is inextricably tied to the type of week.

## Third Solution: ditch objects, use only functions

Lastly, I wanted to see what it looked like to solve the problem without objects. The logic is basically the same, there just aren't any class abstractions:

```py
import datetime
import calendar


def last_date_of_the_month(month, year):
    if month == 2:
        if calendar.isleap(year):
            end_date = 29
        else:
            end_date = 28
    elif month in [9, 4, 6, 11]:
        end_date = 30
    else:
        end_date = 31

    return end_date

def start_date(week_type, month, year):
    type_to_start_date_map = {
        "first": 1,
        "second": 8,
        "third": 15,
        "fourth": 22,
        "fifth": 29,
        "teenth": 13,
        "last": last_date_of_the_month(month, year) - 6
    }

    return type_to_start_date_map[week_type]

def date_matching_day_of_week(year, month, week_type, day_of_week):
    week_start_date = start_date(week_type, month, year)
    distance_from_week_start_date = 0
    number_of_days_in_a_week = 7

    while distance_from_week_start_date < number_of_days_in_a_week:
        try:
            date_integer = week_start_date + distance_from_week_start_date
            date = datetime.datetime(year, month, date_integer).strftime("%A")
        except:
            raise MeetupDayException("That day does not exist.")

        if date == day_of_week:
            return date_integer
        else:
            distance_from_week_start_date += 1

def meetup(year, month, week, day_of_week):
    matching_date = date_matching_day_of_week(year, month, week, day_of_week)
    return datetime.date(year, month, matching_date)
```

In this iteration, `month.last_date(self)` becomes `last_date_of_the_month(month, year)`, `week.date_matching_day_of_week(self)` becomes `date_matching_day_of_week(year, month, week_type, day_of_week)`. If this code never needed to change, the function-only solution is good enough. It's readable and gets rid of the duplicate looping from my first solution.

### Conclusion

It's more likely than not that the meetup code will need to change. Not because the first date in a teenth week will ever not be 13, or the last date in a non-leap year February will ever not be 28, but because this code exists *in the context of all in which it lives and what came before it*[^1] ... and what will come after it. It's more than 75% likely (my metric for decision-making) that a program that asks for the date of the first Saturday of November in 2022 will need to make more calculations with years, months, weekdays, and dates. What is two weeks from the first Saturday of November in 2022? How many Saturdays are there in 2022? If 'Meetup A' convenes on the last Thursday of every month, when will that conflict with 'Meetup B' that convenes on the fourth Thursday of every month? Given what we know now and what is reasonable to expect in the future, I believe the best solution then is the second one: stick with classes, eliminate unnecessary effort.

[^1]: <a href="https://en.wikipedia.org/wiki/You_think_you_just_fell_out_of_a_coconut_tree%3F" target="_blank">You think you just fell out of a coconut tree?</a>
