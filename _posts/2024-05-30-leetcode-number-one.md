---
layout: post
title:  "Solving LeetCode: merge sorted array"
date:   2024-05-30
---
## Table of Contents

[Background and motivation](#background--motivation)<br>
[The problem](#the-problem-88-merge-sorted-array)<br>
[The solution](#the-solution)<br>
[Understanding the solution: part 1](#understanding-the-solution-part-1)<br>
[Understanding the solution: part 2](#understanding-the-solution-part-2)<br>
[What I learned](#what-i-learned)

## Background + motivation

As I start to prepare for SRE interviews, I want to get back in the habit of writing Ruby code regularly since SRE interviews often require candidates to pass a coding challenge.

In the past, I've used [Exercism](https://exercism.org/) to prepare[^1]. I appreciate that most problems on Exercism closely resemble problems you solve in your day-to-day job as a web developer. I also admire Exercism's principles, specifically "Exercism should feel safe and nurturing" and "Exercism focuses on the learning journey, not the destination. The process and enjoyment of learning is more important than absolute factual correctness."

I was curious, though, to explore another side of coding interview prep: LeetCode. According to its Google search result description, LeetCode's goal is to help you level up your coding skills and quickly land a job. Among the tech community, LeetCode has a reputation for creating problems that replicate interview questions asked at large tech companies like Alphabet, Meta, and Netflix. While writing this blog post, I also learned that LeetCode runs weekly and biweekly coding contests. At the end of each contest, participants are assigned a rank based on solve speed and complexity of problem(s) solved.

I have some pretty critical takes on LeetCode. I wrote more about that [here](#more-on-leetcode). I was still curious enough, though, to lay down $35.00 for a monthly subscription and try to actually solve a LeetCode problem because learning is fun!, and I wanted to prove to myself that I was smart enough to understand a LeetCode problem and its solution[^2].

## The problem: 88. Merge Sorted Array

I chose to try and solve "88. Merge Sorted Array" because it was the first problem in LeetCode's "Top Interview 150" study plan.

### Problem description

In "88. Merge Sorted Array", you are given two integer arrays `nums1` and `nums2`, sorted in **non-decreasing order**, and two integers `m` and `n`, representing the number of elements in `nums1` and `nums2` respectively.

Your goal is to merge `nums1` and `nums2` into a single array sorted in **non-decreasing** order. The final sorted array should not be returned by the function, but instead be *stored inside the array* `nums1`. To accommodate this, `nums1` has a length of `m + n`, where the first `m` elements denote the elements that should be merged, and the last `n` elements are set to `0` and should be ignored. `nums2` has a length of `n`.

### First Impressions

- What is **non-decreasing** order ? Why not just say **increasing** order?
- `nums1`, `nums2`, `m`, `n` ... alright well, why not just call them `a`, `b`, `doodle` and `dee`?
- I'm confused :upside-down-smile:

### Attempts to solve

I wish I had saved my first few solve attempts, but alas, I didn't know then I'd be blogging about it. I do remember writing a solution where I replaced each zero in the first number array with an integer from the second number array, then used the Ruby array method `sort!` to sort the remaining values in increasing order. This failed several of the test cases. I also remember trying to iterate over the first numbers array, inserting values from the second array at the appropriate location, then removing all the zeroes from the first numbers array at the end, which also didn't work but I don't remember why.

## The solution

After spending about 45 minutes attempting to solve the problem, I gave myself permission to look ahead to the solutions. I chose "Explanation with code on ruby" by user [worldisaduck](https://leetcode.com/u/worldisaduck/). Thank you, `worldisaduck`, for your help!

```ruby
def merge(nums1, m, nums2, n)
  i = nums1.length - 1
  m -= 1
  n -= 1

  while i >= 0 && n >= 0
    if m >= 0 && nums1[m] > nums2[n]
      nums1[i] = nums1[m]
      m -= 1
    else
      nums1[i] = nums2[n]
      n -= 1
    end
    i -= 1
  end
end

# code by worldisaduck
```

## Understanding the solution: part 1

As written, the solution was hard for me to understand. Why am I comparing `nums1[m]` to `nums2[n]`? What even is `nums1[m]`? I decided to annotate it and rename some variables to make it make more sense to me. I also realized the while loop only needed to check the `nums2_index`. The comments and variables are my sixth or seventh iteration of figuring it out:

```ruby
def merge(nums1, nums1_non_zero_length, nums2, nums2_length)
    position_in_contention_for_current_highest_value = nums1.length - 1
    # starting with the highest number in the `nums1` array and the highest number in the `nums2` array
    nums1_non_zero_index = nums1_non_zero_length - 1
    nums2_index = nums2_length - 1

    # and so long as the shorter array still has values up for comparison
    while nums2_index >= 0
        # check if `nums1` still has values that need to undergo comparison
        # if yes, then see if the value up for comparison in `nums1` is greater than the value up for comparison in `nums2`
        if nums1_non_zero_index >= 0 && nums1[nums1_non_zero_index] > nums2[nums2_index]
            # if yes, assign the higher value (will always comes from nums1) to the position in contention
            nums1[position_in_contention_for_current_highest_value] = nums1[nums1_non_zero_index]
            # move down the line on the non-zero values in nums1 array
            nums1_non_zero_index -= 1
        else
            # otherwise, assign the higher value (will always comes from nums2) to the position in contention
            nums1[position_in_contention_for_current_highest_value] = nums2[nums2_index]
            # move down the line on the nums2 array
            nums2_index -= 1
        end
        # the position up for contention has been filled for this turn; keep on moving down the line
        position_in_contention_for_current_highest_value -= 1
    end
end
```

## Understanding the solution: part 2

I also wanted to let myself see what was going on at each step by allowing myself to move the numbers around and see stuff with my eyes instead of in my head, so I made manipulatives. Manipulatives are objects teachers use to translate abstract ideas into something tangible. I love manipulatives.

Each row of images below corresponds to a turn through the `while` loop in the code. The loop continues so long as the shorter array (`nums2`) still has values up for comparison.

The #merge function has four parameters, `nums1`, `nums1_non_zero_length`, `nums2`, and `nums2_length`. In the pictures,

- `nums1` is the top purple array: `[1,2,3,0,0,0]`
- `nums2` is the bottom purple array: `[2,5,6]`

The remaining two parameters, `nums1_non_zero_length` and `nums2_length`, are used to calculate the two starting indices:

- `nums1_non_zero_index` is equal to `nums1_non_zero_length` minus one since indices start at 0. That's 3 - 1 = 2. The value at index 2 in `nums1` is 3. The blue triangle marks this spot.
- `nums2_index` is equal to `nums2_length` minus one since indices start at 0. That's 3 - 1 = 2. The value at index 2 in `nums2` is 6. The red triangle marks this spot.

Finally, the green triangle sits at the `position_in_contention_for_current_highest_value`, which starts at the last position in `nums1` since we're sorting values from highest to lowest.

### 1st turn

<div class="image-wrapper iteration">
  <img src="/assets/images/1-first-position.jpg" alt="First starting position">
  <img src="/assets/images/2-first-comparison.jpg" alt="First comparison">
  <img src="/assets/images/3-first-placement.jpg" alt="First placement">
  <img src="/assets/images/4-second-position.jpg" alt="First final position">
</div>

**Goal**: Find the highest number from both arrays and place it at the end of `nums1`.<br>
**Method**: Compare the highest number from `nums1` to the highest number from `nums2`<br>
  -if the `nums1` value is greater, place it at the position-in-contention-for-highest-value in `nums1` and move the marker for current highest value in `nums1` down one<br>
  -if the `nums2` value is greater, place it at the position-in-contention-for-highest-value in `nums1` and move the marker for the current highest value in `nums2` down one<br>
In all cases, move the marker for the position in contention for the highest value down one<br>
**Action taken**: Place 6 at the position-in-contention. Move the markers for current highest value in `nums2` and position-in-contention down one.

### 2nd turn

<div class="image-wrapper iteration">
  <img src="/assets/images/4-second-position.jpg" alt="Second starting position">
  <img src="/assets/images/5-second-comparison.jpg" alt="Second comparison">
  <img src="/assets/images/6-second-placement.jpg" alt="Second placement">
  <img src="/assets/images/7-third-position.jpg" alt="Second final position">
</div>

**Goal**: Find the next highest number from both arrays and place it right before the previous greatest number.<br>
**Method**: Compare the current highest number from `nums1` to the current highest number from `nums2`<br>
  -if the `nums1` value is greater, place it in the position-in-contention-for-highest-value and move the marker for current highest value in `nums1` down one<br>
  -if the `nums2` value is greater, place it in the position-in-contention-for-highest-value and move the marker for current highest value in `nums2` down one<br>
**Action taken**: Place 5 at the position-in-contention. Move the markers for current highest value in `nums2` and position-in-contention down one.

### 3rd turn

<div class="image-wrapper iteration">
  <img src="/assets/images/7-third-position.jpg" alt="Third starting position">
  <img src="/assets/images/8-third-comparison.jpg" alt="Third comparison">
  <img src="/assets/images/9-third-placement.jpg" alt="Third placement">
  <img src="/assets/images/10-fourth-position.jpg" alt="Third final position">
</div>

**Goal**: Same as before<br>
**Method**: Same as before<br>
**Action taken**: Place 3 at the position-in-contention. Move the markers for current highest value in `nums1` and position-in-contention down one.<br>

### 4th turn

<div class="image-wrapper iteration">
  <img src="/assets/images/10-fourth-position.jpg" alt="Fourth starting position">
  <img src="/assets/images/11-fourth-comparison.jpg" alt="Fourth comparison">
  <img src="/assets/images/12-fourth-placement.jpg" alt="Fourth placement">
  <img src="/assets/images/13-fifth-position.jpg" alt="Fourth final position">
</div>

**Goal**: Same as before<br>
**Method**: Same as before<br>
**Action taken**: Place 2 at the position-in-contention. Move the markers for current highest value in `nums2` and position-in-contention down one.<br>

### 5th turn
<div class="image-wrapper iteration">
  <img src="/assets/images/13-fifth-position.jpg" alt="Fifth starting position">
</div>

**Goal**: Same as before<br>
**Method**: Same as before<br>
**Action taken**: None needed! There are no more `nums2` values up for comparison. The values in `nums1` are correctly sorted in increasing order. Ta da!

## What I learned

- It's worth considering if it makes sense to iterate over an array backwards (right to left, end to beginning, etc).
- You don't always need to move values from one array to another (add to one; delete from another).
- While working toward the correct solution, there will be points where the work in progress looks wrong. This was the case for me with the 3rd turn in this problem. I was so confused. How could `nums1` have two 3's? That can't be right; there's only one 3 in the whole bunch. It was a learning moment for me to recognize that the two 3's wouldn't stick around because the second 3 in the 3rd turn placement ([1,2,3,**3**,5,6]) was in its final position, whereas the first 3 ([1,2,**3**,3,5,6]) was just a placeholder for the next highest value to go and that next value could never be a 3 because the 3 had already gone to battle in the comparison ring.
- It's okay to look ahead at the solution. That's how you learn.
- Using manipulatives makes learning fun! It also helps me build reusable mental models that I can bring with me into future coding problems.

### More on LeetCode

From my view, the kind of technical interview questions LeetCode endorses encourage developers to write code as close to its raw state as possible (variables named "input" and classes named "stringToListNode"). LeetCode also fosters an environment where users evaluate themselves on speed, correctness, and how fast and how right they are compared to other LeetCode users.

More to the heart of the issue, though, is that using LeetCode-like (data structures and algorithms) problems to screen candidates belies an employer mindset that their employees are members of an elite class. They're smarter (better) than people who don't work there, and admission to the group of elites requires interviewees to prove their worth by a willingness to spend dozens, if not hundreds, of hours learning how to solve puzzles they'll only ever have to solve again in an interview setting.

------------------
<br>

[^1]: I recently deleted all my old solutions to Exercism's Ruby track after conceding to an urge to burn it all down and start fresh. You can check out my solutions to Ruby Exercism problems [here](https://github.com/medwards1771/exercism/tree/main/ruby).

[^2]: Ideally I wouldn't feel the need to prove to myself that I'm smart enough or good enough by showing I can solve LeetCode-esque problems. I have compassion for the part of me that believes doing so qualifies me as "smart enough," though, because this is the message sent to developers by companies who use these problems to screen candidates.
