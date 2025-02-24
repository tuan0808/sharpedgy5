import {Component, HostListener, inject} from '@angular/core';
import {ToastrService} from "ngx-toastr";
import {Chess} from "chess.js";
import {NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-analytics-chart',
  standalone: true,
  imports: [
    NgIf,
    NgForOf
  ],
  templateUrl: './analytics-chart.component.html',
  styleUrl: './analytics-chart.component.scss'
})
export class AnalyticsChartComponent {
  dataModel = new Chess(); // Chess game instance
  dataGrid: any[][] = []; // Board representation
  selected: { x: number; y: number } | null = null; // Current selected cell
  validOptions: string[] = []; // Available moves for selected piece
  isThinking = false; // Flag to indicate AI is "thinking"
  private resizeTimeout: any = null;

  constructor(private notifier: ToastrService) {}

  ngOnInit() {
    this.refreshData();
  }

  ngOnDestroy() {
    // Clear any timers
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }

  // Listen for window resize events
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    // Debounce resize events
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = setTimeout(() => {
      // Could add specific resize logic here if needed
    }, 200);
  }

  // Update the grid based on the current state
  private refreshData() {
    this.dataGrid = this.dataModel.board();
  }

  // Convert piece to display symbol
  protected computeValue(entry: any): string {
    if (!entry) return '';
    const mappings = {
      'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔',
      'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚'
    };
    return mappings[entry.type] || '';
  }

  // Handle user clicks on the grid
  handleInput(x: number, y: number) {
    // Only allow moves when it's the player's turn (white)
    if (this.dataModel.turn() !== 'w') {
      this.notifier.info("It's black's turn. Please wait.", 'Player Turn');
      return;
    }

    const position = this.toCode(x, y);

    if (this.selected) {
      const origin = this.toCode(this.selected.x, this.selected.y);
      const action = { from: origin, to: position, promotion: 'q' };

      // Try to make the player's move
      if (this.dataModel.move(action)) {
        this.refreshData();
        this.selected = null;
        this.validOptions = [];

        if (this.evaluateStatus()) {
          // Game is over, don't make an AI move
          return;
        }

        // Player made a move, now let AI respond
        if (this.dataModel.turn() === 'b') {
          this.isThinking = true;
          // Simulate AI "thinking" time
          setTimeout(() => {
            this.makeAIMove();
            this.isThinking = false;
          }, 500);
        }
      } else {
        this.activateCell(x, y);
      }
    } else {
      this.activateCell(x, y);
    }
  }

  // Select a cell and show possible moves
  private activateCell(x: number, y: number) {
    const position = this.toCode(x, y) as any;
    const entry = this.dataModel.get(position);

    // Only allow selecting white pieces when it's white's turn
    if (entry && entry.color === this.dataModel.turn() && entry.color === 'w') {
      this.selected = { x, y };

      const moves = this.dataModel.moves({
        square: position,
        verbose: true
      }) as any[];

      this.validOptions = moves.map(m => {
        const coords = this.fromCode(m.to);
        return `${coords.x},${coords.y}`;
      });
    } else {
      this.selected = null;
      this.validOptions = [];
    }
  }

  // Make a move for the AI (black pieces)
  makeAIMove() {
    // Get all possible moves for black
    const moves = this.dataModel.moves({ verbose: true });

    if (moves.length === 0) {
      // No moves available, game should be over
      this.evaluateStatus();
      return;
    }

    // Simple strategy: prioritize capturing moves, then checks, then random moves
    const capturingMoves = moves.filter(move => move.flags.includes('c'));
    const checkingMoves = moves.filter(move => move.san.includes('+'));

    let selectedMove;

    if (capturingMoves.length > 0) {
      // Further prioritize capturing higher value pieces
      const sortedCaptures = [...capturingMoves].sort((a, b) => {
        const getPieceValue = (piece) => {
          if (!piece) return 0;
          const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
          return values[piece.toLowerCase()] || 0;
        };

        const captureA = this.dataModel.get(a.to);
        const captureB = this.dataModel.get(b.to);

        return getPieceValue(captureB?.type) - getPieceValue(captureA?.type);
      });

      selectedMove = sortedCaptures[0];
    } else if (checkingMoves.length > 0) {
      selectedMove = checkingMoves[0];
    } else {
      // Pick a random move
      const randomIndex = Math.floor(Math.random() * moves.length);
      selectedMove = moves[randomIndex];
    }

    // Make the selected move
    this.dataModel.move(selectedMove);
    this.refreshData();
    this.evaluateStatus();
  }

  // Check for game over conditions - returns true if game is over
  private evaluateStatus(): boolean {
    if (this.dataModel.isGameOver()) {
      let message = '';
      if (this.dataModel.isCheckmate()) {
        message = this.dataModel.turn() === 'w' ? 'Black wins!' : 'White wins!';
      } else if (this.dataModel.isStalemate()) {
        message = 'Draw by stalemate';
      } else if (this.dataModel.isDraw()) {
        message = 'Draw';
      }
      this.notifier.info(message, 'Game Over');
      return true;
    }
    return false;
  }

  // Reset the game
  resetGame() {
    this.dataModel.reset();
    this.refreshData();
    this.selected = null;
    this.validOptions = [];
    this.isThinking = false;
    this.notifier.success('Game reset', 'New Game');
  }

  // Convert coordinates to algebraic notation (e.g., 'e2')
  private toCode(x: number, y: number): string {
    const columns = 'abcdefgh';
    const rows = '87654321';
    return columns[x] + rows[y];
  }

  // Convert algebraic notation to coordinates
  private fromCode(position: string): { x: number; y: number } {
    const columns = 'abcdefgh';
    const rows = '87654321';
    const x = columns.indexOf(position[0]);
    const y = rows.indexOf(position[1]);
    return { x, y };
  }
}
