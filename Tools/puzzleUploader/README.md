# Puzzle Uploader Guide

This tool helps you format, validate, and upload puzzles to the Firebase database.

## Process Overview

1. Create puzzle JSON files in the correct format
2. Check puzzles for accuracy
3. Run `validate.js` to verify puzzle structure
4. Run `upload.js` to upload puzzles to Firebase

Prompt Example:

We have an @example.json file. It provides the structure of a puzzle as it should be within this project. What i want you to do is to take the puzzle I put below, and put it in the correct structure as per the example file. From there, write it to a json file in the puzzleUploader/puzzles folder:

## Step 1: Creating a Puzzle

Create your puzzle JSON files in the `puzzles` folder using the format below:

```json
{
  "themeTitle": "Your Theme Title",
  "themeDescription": "A detailed description of the theme...",
  "puzzleData": {
    "across": {
      "1": {
        "clue": "Your clue text here",
        "answer": "ANSWER",
        "row": 0,
        "col": 0
      },
      // Additional across clues...
    },
    "down": {
      "2": {
        "clue": "Your clue text here",
        "answer": "ANSWER",
        "row": 0,
        "col": 0
      },
      // Additional down clues...
    }
  }
}
```

### Example Puzzle Format

Below is an example of how to format a puzzle from raw data:

**Original Data:**
```
'puzzle-006': {
  metadata: {
    id: 'puzzle-006',
    bookTitle: 'Bulletproof Problem Solving',
    topicName: 'Breaking Down Problems',
    topicDescription: 'To solve a problem effectively, break it into smaller parts. Logic trees help by organizing different aspects of a problem. For example, losing weight can be split into two main ideas: eating less or exercising more. Each of these can be broken down further into specific actions.\n\nA useful logic tree avoids overlap and covers all important factors. Different types exist depending on how much is known about the problem. Trying different approaches can reveal new insights. Since problem-solving is a process, updating the tree as you learn more is key. Once the structure is clear, unnecessary parts can be removed.',
    difficulty: 'medium',
    size: 8
  },
  data: {
    across: {
      4: {
        clue: 'To refine and improve solutions through repeated problem-solving cycles',
        answer: 'ITERATE',
        row: 4,
        col: 0
      },
      5: {
        clue: 'The structured reasoning process behind problem-solving methods',
        answer: 'LOGIC',
        row: 6,
        col: 0
      }
    },
    down: {
      1: {
        clue: 'To remove unnecessary parts of a tree, both in logic and in nature',
        answer: 'PRUNE',
        row: 0,
        col: 2
      },
      2: {
        clue: 'Factors that can be adjusted to disproportionately affect an outcome',
        answer: 'LEVER',
        row: 1,
        col: 6
      },
      3: {
        clue: 'A division in a logic tree representing a part of a problem',
        answer: 'BRANCH',
        row: 2,
        col: 4
      }
    }
  }
}
```

**Correctly Formatted Puzzle (puzzle-006.json):**
```json
{
  "themeTitle": "Breaking Down Problems",
  "themeDescription": "To solve a problem effectively, break it into smaller parts. Logic trees help by organizing different aspects of a problem. For example, losing weight can be split into two main ideas: eating less or exercising more. Each of these can be broken down further into specific actions.\n\nA useful logic tree avoids overlap and covers all important factors. Different types exist depending on how much is known about the problem. Trying different approaches can reveal new insights. Since problem-solving is a process, updating the tree as you learn more is key. Once the structure is clear, unnecessary parts can be removed.",
  "puzzleData": {
    "across": {
      "4": {
        "clue": "To refine and improve solutions through repeated problem-solving cycles",
        "answer": "ITERATE",
        "row": 4,
        "col": 0
      },
      "5": {
        "clue": "The structured reasoning process behind problem-solving methods",
        "answer": "LOGIC",
        "row": 6,
        "col": 0
      }
    },
    "down": {
      "1": {
        "clue": "To remove unnecessary parts of a tree, both in logic and in nature",
        "answer": "PRUNE",
        "row": 0,
        "col": 2
      },
      "2": {
        "clue": "Factors that can be adjusted to disproportionately affect an outcome",
        "answer": "LEVER",
        "row": 1,
        "col": 6
      },
      "3": {
        "clue": "A division in a logic tree representing a part of a problem",
        "answer": "BRANCH",
        "row": 2,
        "col": 4
      }
    }
  }
}
```

## Step 2: Checking Your Puzzle

Before proceeding, verify:
- All clue numbers are strings (e.g., "1" instead of 1)
- Row and col positions are correct
- All answers are in UPPERCASE
- Ensure all words connect properly in the grid

## Step 3: Validating Puzzles

Run the validation script to check for structural issues:

```
node validate.js
```

This will check all puzzles in the `puzzles` folder for:
- Required fields
- Data format correctness
- Grid structure validity
- Word connections

Fix any issues reported by the validation script before proceeding.

## Step 4: Uploading Puzzles

Once your puzzles are validated, upload them to Firebase:

```
node upload.js
```

This will:
1. Read all validated puzzles from the `puzzles` folder
2. Upload them to your Firebase Firestore database
3. Update the metadata as needed

## Notes

- Puzzle IDs will be assigned based on the filename (e.g., puzzle-006.json becomes puzzle-006)
- The upload script requires proper Firebase credentials in your .env file
- Back up existing puzzles before uploading new ones 