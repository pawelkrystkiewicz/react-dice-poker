1. Install my chunks-ui https://ui-kit.chunk-creations.com/llm.txt library and
2. create a basic UI for Dice Poker e will simulate behaviour of the mini-game from Witcher 1.
3. The "dice" will be virtual - just displaying Math.random numbers.
4. You can create initial state, but don't write the function for reading the results summary yet - I want to do this myself because this seems like leet code problem.

The main issue I want to train is to detect the state:

There are 5 dices in set, user throws first, then oponent AI

Winning sets (latter the better):

A. Pair - 2 same numbers [5,5,1,3,4]
B. 2 Pairs - 2xA -> 2 sets of 2 same numbers [1,1,3,2,2]
C. Threes - 3 same numbers [1,2,4,4,4]
D. Small strit - no repeating numbers from 1 to 5 [5,3,1,4,2]
E. Big strit - no repeating numbers from 2 to 6 [5,2,4,1,6]
F. Full - A + C [1,1,1,5,5]
G. Kareta - 4 same numbers [3,3,3,3,2]
H. Poker - 5 same numbers [2,2,2,2,2]

From what I understand, in The Witcher there are up to 3 rounds. The player needs to win 2 rounds to win the game. Draws are possible, and if players have the same winning, the sum of the numbers wins.

- one of the behaviors I don't really want to replicate is if you had very strong hand, say your opponent had nothing and you had a C and better, then the opponent forfeited the game.
- we can have "start over" mechanics

Write what you know about the game mechanic so we can implement correct mechanics.
