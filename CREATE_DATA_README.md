# Test Data Creation Script

## Description

The `createdata.js` script automatically creates:
- A `teacher` user with password `teacher` and `instructor` role
- Complete test course "Programming Fundamentals" with 5 chapters and 10 lessons

## Usage in Docker

1. Rebuild Docker image to include the script:
```bash
docker compose build --no-cache
```

2. Run the script:
```bash
docker compose exec app node createdata.js
```

## Usage in Replit

Simply execute the command:
```bash
node createdata.js
```

## Created Data

### User
- **Username:** teacher
- **Password:** teacher  
- **Role:** instructor

### Course: "🎓 Programming Fundamentals"
- **Status:** published
- **Public:** yes
- **Registration allowed:** yes

#### Chapters and lessons:
1. **📚 Introduction to Programming**
   - What is Programming?
   - History of Programming Languages

2. **🔤 Variables and Data Types**
   - Variables: What They Are and Why We Need Them
   - Data Types: Numbers, Strings, Booleans

3. **🔄 Loops and Conditions**
   - Conditional Statements if/else
   - Loops: for and while

4. **⚙️ Functions**
   - Creating and Calling Functions
   - Parameters and Return Values

5. **🏗️ Object-Oriented Programming**
   - Object-Oriented Programming Basics
   - Classes and Objects

## Features

- Script safely handles data duplication using `ON CONFLICT DO NOTHING`
- Re-running the script doesn't create duplicate records
- Shows detailed execution progress
- Requires no parameters or user interaction