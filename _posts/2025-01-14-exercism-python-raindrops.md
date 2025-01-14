---
layout: post
title:  "Solving raindrops on Exercism in Python"
date:   2025-01-14
---

## Purpose + motivation

Recently I've been interviewing for SRE positions and getting stuck on the programming part of the technical interview. I've spent the last four years focused on DevOps tools: Terraform, Docker, Linux, Bash, Kubernetes, etc. I have still been writing Python and Ruby, but far less frequently, so I'm a little rusty. To help get my code game back, I was working privately in Exercism's Python track. Then I realized I would retain more (and probably have more fun) by writing blog posts to go along with exercises as I solved them.

## Description of the problem

Title: Raindrops

Difficulty Level: Easy

Description: (taken directly from Exercism's [website](https://exercism.org/tracks/python/exercises/raindrops))

```md
Your task is to convert a number into its corresponding raindrop sounds.

If a given number:

is divisible by 3, add "Pling" to the result.
is divisible by 5, add "Plang" to the result.
is divisible by 7, add "Plong" to the result.
is not divisible by 3, 5, or 7, the result should be the number as a string.
```

## Method interface

```py
def convert(number):
    # returns raindrop sound
```

## Solution Journey

### Simplest, most straightforward tests

1. RaindropsTest::test_the_sound_for_3_is_pling
1. RaindropsTest::test_the_sound_for_5_is_plang
1. RaindropsTest::test_the_sound_for_7_is_plong

Here I see three different numbers that have a 1-to-1 match with the sound they're meant to response with. I'll create a dict and, given the number passed, return its corresponding sound.

```py
def convert(number):
    number_to_sound_map = {
        3: "Pling",
        5: "Plang",
        7: "Plong",
    }

    return number_to_sound_map[number]
```

### Complication introduced

1. RaindropsTest::test_the_sound_for_6_is_pling_as_it_has_a_factor_3
1. RaindropsTest::test_the_sound_for_10_is_plang_as_it_has_a_factor_5
1. RaindropsTest::test_the_sound_for_14_is_plong_as_it_has_a_factor_of_7
1. RaindropsTest::test_the_sound_for_1_is_1
1. RaindropsTest::test_the_sound_for_52_is_52

Okay, now I can see that there is no longer a 1-to-1 match between numbers and sounds -- instead, numbers match a sound based on whether or not they have a factor of 3, 5, or 7.

Technically I *could* keep going with the dict approach by changing the keys to strings like "has_factor_of_3", then writing a helper method that returns "has_factor_of_x" for a given number. I could also keep the dict as is and write a helper method that would return 3, 5, or 7 for a given number depending on which value is a factor. But in doing that, I can foresee I'll have to send the number through a min of one check and max of three checks (check if factor of 3, return if true; check if factor of 5, return if true; check if factor of 7, return if true; otherwise return the number converted to type string). So while I'm already checking the number for factors, I can just return "Pling", "Plang", etc rather than fuss about making a key to later match in the dict:

```py
def convert(number):
    if number % 3 == 0:
        return "Pling"
    elif number % 5 == 0:
        return "Plang"
    elif number % 7 == 0:
        return "Plong"
    else:
        return str(number)
```

### Last and final complication introduced

1. RaindropsTest::test_the_sound_for_105_is_pling_plang_plong_as_it_has_factors_3_5_and_7
1. RaindropsTest::test_the_sound_for_15_is_pling_plang_as_it_has_factors_3_and_5
1. RaindropsTest::test_the_sound_for_21_is_pling_plong_as_it_has_factors_3_and_7
1. RaindropsTest::test_the_sound_for_35_is_plang_plong_as_it_has_factors_5_and_7

Hmm hmm hmm. Ok, so I'm no longer returning "Pling" OR "Plang" OR "Plong" -- I'm returning a composite value made up of each sound the number has factors for. I can't keep returning once I find a factor match; now I need to run the three factor checks on every number. I'm also going to need to build on the ultimate return value as I go. At least, that strategy is more efficient (and easier to parse) than running a min of one and max of seven checks on each number: do you have factors of 3/5/7, of 3/5, of 3/7, of 5/7, of 3, of 5, or of 7.

### First solution

This brings me to my **first solution** ! Here, I create an empty string I can use to add sounds to as I run each factor check. At the end, I rely on the fact that empty strings are falsy in Python to either return the composite sound or the number converted to type string.

```py
def convert(number):
    composite_sound = ""

    if number % 3 == 0:
        composite_sound += "Pling"
    if number % 5 == 0:
        composite_sound += "Plang"
    if number % 7 == 0:
        composite_sound += "Plong"

    return composite_sound or str(number)
```

This solution makes it fairly clear that there's a relationship between the factors 3, 5, and 7 and certain sounds, that we're checking for each factor in order to construct a composite value, and numbers without factors of 3, 5, or 7 get converted to strings. Silence is not a valid response.

### Small adjustment

You could also go back to the dict idea and use that data structure to make explicit the relationship between the numbers 3, 5, 7 and their raindrop sounds. That would look like:

```py
factors_raindrop_sound_map = {
    3: "Pling",
    5: "Plang",
    7: "Plong",
}

def convert(number):
    composite_sound = ""

    for factor, raindrop_sound in factors_raindrop_sound_map.items():
        if number % factor == 0:
            composite_sound += raindrop_sound

    return composite_sound or str(number)
```

### Solving using classes

You could even define a custom class to solve the problem:

```py
class RaindropNumber():
    factors_raindrop_sound_map = {
        3: "Pling",
        5: "Plang",
        7: "Plong",
    }

    def sound(number):
        composite_sound = ""
        for factor, raindrop_sound in RaindropNumber.factors_raindrop_sound_map.items():
            if number % factor == 0:
                composite_sound += raindrop_sound
        return composite_sound or str(number)

def convert(number):
    return RaindropNumber.sound(number)
```

Defining and using class the custom class `RaindropNumber` doesn't change anything about the solution logic; it just delegates the convert function to a `RaindropNumber` class method. Calling `RaindropNumber.sound(number)` does add a shade of meaning though. It's more descriptive than `convert(number)`. The class isn't used as a template to create multiple `raindrop_number` objects, so no need for instantiation. Ultimately it's just a descriptive container for the solution logic.

## Takeaways

- I like the first solution best because it gets the job done simply, efficiently, and is dead easy to understand.
- This exercise is uses "catchall" logic. For all inputs that match the given criteria (are a factor of 3, 5, or 7), do `x`. For everything else (the catchall), do `y`.
- Requiring the response to account for all possible factors mandates that every input go through a minimum of three branches of logic -- one for each possible factor.
