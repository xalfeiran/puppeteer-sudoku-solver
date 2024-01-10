// scrapeSudoku.js
const puppeteer = require('puppeteer');

(async () => {

    try{
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        // Enable debugging on the page
        //page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

        const gotoTimeout = 10000; // in milliseconds

        // Navigate to the Sudoku website
        await page.goto('https://es2.websudoku.com/', { waitUntil: 'domcontentloaded'});

        // Wait for the page to load
        await page.waitForSelector('#puzzle_grid', { timeout: gotoTimeout });

        // Get the sudoku table #puzzle_grid
        const sudokuTable = await page.$('#puzzle_grid');
        
        // read the sudoku table
        const sudokuTableData = await page.evaluate(table => {
            const rows = Array.from(table.querySelectorAll('tr'));
            return rows.map(row => {
                const columns = Array.from(row.querySelectorAll('input'));
                // get the column parent node id
                return columns.map(column => {
                    return {
                        id: column.parentNode.id,
                        value: column.value
                    }});
            });
        }, sudokuTable);

        const solveSudoku = (board) => {
            const emptyCell = findEmptyCell(board);
          
            if (!emptyCell) {
              // No empty cell left, the puzzle is solved
              return true;
            }
          
            const [row, col] = emptyCell;
          
            for (let num = 1; num <= 9; num++) {
              if (isValidMove(board, row, col, num)) {
                // Try placing the number
                board[row][col] = num;
          
                // Recursively try to solve the remaining puzzle
                if (solveSudoku(board)) {
                  return true; // Solution found
                }
          
                // If the current placement doesn't lead to a solution, backtrack
                board[row][col] = 0;
              }
            }
          
            // No valid number was found, backtrack
            return false;
          };
          
          const findEmptyCell = (board) => {
            for (let row = 0; row < 9; row++) {
              for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                  return [row, col];
                }
              }
            }
            return null; // If no empty cell is found, the puzzle is solved
          };
          
          const isValidMove = (board, row, col, num) => {
            // Check if 'num' is not present in the same row and column
            for (let i = 0; i < 9; i++) {
              if (board[row][i] === num || board[i][col] === num) {
                return false;
              }
            }
          
            // Check if 'num' is not present in the 3x3 subgrid
            const startRow = Math.floor(row / 3) * 3;
            const startCol = Math.floor(col / 3) * 3;
            for (let i = 0; i < 3; i++) {
              for (let j = 0; j < 3; j++) {
                if (board[startRow + i][startCol + j] === num) {
                  return false;
                }
              }
            }
          
            // 'num' can be placed in this cell
            return true;
          };
          
          const convertSudokuDataToBoard = (sudokuTableData) => {
            const board = [];
          
            for (let i = 0; i < 9; i++) {
              const row = [];
              if (!sudokuTableData[i] || sudokuTableData[i].length !== 9) {
                console.error(`Unexpected data structure or incomplete row at index ${i}`);
                return null;
              }
              for (let j = 0; j < 9; j++) {
                const cell = sudokuTableData[i][j];
                row.push(parseInt(cell.value) || 0);
              }
              board.push(row);
            }
          
            return board;
          };

        const sudokuBoard = convertSudokuDataToBoard(sudokuTableData);

        if (!sudokuBoard) {
            console.error('Failed to convert sudokuTableData to board.');
          } else {
            if (solveSudoku(sudokuBoard)) {
              console.log('Sudoku solved:', sudokuBoard);
            } else {
              console.log('No solution exists.');
            }
        }

        // loop through the sudoku table and fill the values
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = sudokuTableData[i][j];
                if (cell.value === '') {
                    // fill the value in the input box inside the cell
                    await page.waitForSelector(`#${cell.id}`, { timeout: gotoTimeout });
                    await page.click(`#${cell.id}`);
                    await page.type(`#${cell.id}`, sudokuBoard[i][j].toString());
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        }

        await page.evaluate(() => {
            alert('Hello, Sudoku solved!');
        });

        await new Promise(resolve => setTimeout(resolve, 10000));
      
        // call a method that will solve the sudoku
        await browser.close();

        // Close the browser on user interaction
        console.log('Close the browser manually to end the script.');
        } catch (e) {
            console.log(e);
        }
})();
