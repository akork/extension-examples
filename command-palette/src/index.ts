import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { ICommandPalette } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';

import '../style/index.css';

class JupyterLabSublime {
  private tracker: INotebookTracker;
  private app: JupyterFrontEnd;
  private palette: ICommandPalette;

  constructor(
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    tracker: INotebookTracker
  ) {
    this.app = app;
    this.tracker = tracker;
    this.palette = palette;
    this.addCommands();
    this.onActiveCellChanged();
    this.tracker.activeCellChanged.connect(this.onActiveCellChanged, this);
  }

  // private editorExecc(id: string) {
  // const self = this;
  // (self.tracker.activeCell.editor as CodeMirrorEditor).editor.execCommand(
  // id
  // );
  // }

  private cmMap(key: string, cmd: string) {
    let jlCmd: string = cmd;
    let cmCmd: string;
    const { commands } = this.app;
    if (cmd.charAt(0) == ':') {
      jlCmd = 'cmm' + cmd;
      cmCmd = cmd.slice(1);
      commands.addCommand(jlCmd, {
        execute: () => {
          this.editorExec(cmCmd);
        },
      });
    }

    commands.addKeyBinding({
      command: jlCmd,
      keys: [key],
      selector: '.CodeMirror-focused',
    });
  }

  private editorExec(id: string) {
    // const self = this;
    (this.tracker.activeCell.editor as CodeMirrorEditor).editor.execCommand(id);
  }

  private addCommand(name: string, fn: any) {
    let dic = {
      label: name,
      execute: fn,
    };
    this.app.commands.addCommand(name, dic);
    const category = 'Extension Examples';
    this.palette.addItem({
      command: name,
      category: category,
      args: { origin: 'from palette' },
    });
  }

  private addCommands() {
    // let editorExec = this.editorExec;
    let editorExec = this.editorExec.bind(this);
    // let addCommand = this.addCommand.bind(this);
    const { commands } = this.app;
    // tslint:disable-next-line
    // const self = this;

    // Manage Escape collision
    // TODO: Check if use has Escape set for command mode
    commands.addCommand('sublime:exit-editor', {
      execute: () => {
        editorExec('singleSelectionTop');
        commands.execute('notebook:enter-command-mode');
      },
      label: 'Exit Editor',
    });
    commands.addKeyBinding({
      command: 'sublime:exit-editor',
      keys: ['Escape'],
      selector: '.CodeMirror-focused',
    });

    // Manage Ctrl-/ collision
    commands.addCommand('sublime:toggle-comment-indented', {
      execute: () => {
        editorExec('toggleCommentIndented');
      },
      label: 'Split selection by line',
    });
    commands.addKeyBinding({
      command: 'sublime:toggle-comment-indented',
      keys: ['Accel /'],
      selector: '.CodeMirror-focused',
    });

    // Manage Shift-Tab collision
    commands.addCommand('sublime:indent-less-slash-tooltip', {
      execute: () => {
        if (
          !this.tracker.activeCell.editor.host.classList.contains(
            'jp-mod-completer-enabled'
          )
        ) {
          editorExec('indentLess');
        } else {
          commands.execute('tooltip:launch-notebook');
        }
      },
      label: 'Indent less or tooltip',
    });
    commands.addKeyBinding({
      command: 'sublime:indent-less-slash-tooltip',
      keys: ['Shift Tab'],
      selector: '.CodeMirror-focused',
    });

    // Manage Shift-Ctr-L collision
    commands.addCommand('sublime:split-selection-by-lLine', {
      execute: () => {
        editorExec('splitSelectionByLine');
      },
      label: 'Split selection by line',
    });
    commands.addKeyBinding({
      command: 'sublime:split-selection-by-lLine',
      keys: ['Accel Shift L'],
      selector: '.CodeMirror-focused',
    });

    commands.addCommand('cm:bow_right', {
      execute: () => {
        editorExec('goWordLeft');
        editorExec('goWordRight');
        editorExec('goWordLeft');
      },
    });

    commands.addCommand('cm:bow_left', {
      execute: () => {
        editorExec('goCharRight');
        editorExec('goWordLeft');
        editorExec('goWordRight');
        editorExec('goWordRight');
        editorExec('goWordLeft');
      },
    });

    commands.addCommand('cm:eow_right', {
      execute: () => {
        editorExec('goWordRight');
        editorExec('goWordLeft');
        editorExec('goWordRight');
      },
    });

    commands.addCommand('cm:eow_left', {
      execute: () => {
        editorExec('goCharLeft');
        editorExec('goWordRight');
        editorExec('goWordLeft');
        editorExec('goWordLeft');
        editorExec('goWordRight');
      },
    });

    commands.addCommand('cm:nlines_down', {
      execute: () => {
        var i = 6;
        while (i--) editorExec('goLineDown');
      },
    });

    commands.addCommand('cm:nlines_up', {
      execute: () => {
        var i = 6;
        while (i--) editorExec('goLineUp');
      },
    });

    this.cmMap('Ctrl ArrowLeft', 'cm:eow_left');
    this.cmMap('Ctrl ArrowRight', 'cm:eow_right');
    this.cmMap('Alt ArrowLeft', ':goSubwordLeft');
    this.cmMap('Alt ArrowRight', ':goSubwordRight');
    this.cmMap('PageDown', 'cm:nlines_down');
    this.cmMap('PageUp', 'cm:nlines_up');
    this.cmMap('Accel Shift D', ':duplicateLine');
    this.cmMap('Ctrl ArrowDown', ':addCursorToNextLine');
    this.cmMap('Ctrl ArrowUp', ':addCursorToPrevLine');
    this.cmMap('Ctrl M', ':goToBracket');

    commands.addCommand('ak:eval_insert', {
      execute: () => {
        commands.execute('notebook:run-cell');
        commands.execute('notebook:enter-edit-mode');
      },
    });

    commands.addKeyBinding({
      command: 'ak:eval_insert',
      keys: ['N'],
      selector: '.jp-Notebook:focus',
    });

    commands.addCommand('ak:nlbelow', {
      execute: () => {
        const cm = (this.tracker.activeCell.editor as CodeMirrorEditor).editor;
        cm.execCommand('goLineEnd');
        cm.execCommand('newlineAndIndent');
      },
    });

    commands.addKeyBinding({
      command: 'ak:nlbelow',
      keys: ['Ctrl Alt 3'],
      selector: '.CodeMirror-focused',
    });

    this.addCommand('ak:cwd', () => {
      var text = (this.app as any).paths.directories.serverRoot;
      navigator.clipboard.writeText(text).then(
        function () {
          console.log('Async: Copying to clipboard was successful!');
        },
        function (err) {
          console.error('Async: Could not copy text: ', err);
        }
      );
    });

    commands.addCommand('sublime:subword-backward-deletion', {
      execute: () => {
        const cEditor = (this.tracker.activeCell.editor as CodeMirrorEditor)
          .editor;
        const doc = cEditor.getDoc();
        const starts = doc.listSelections();
        // NOTE: This is non-trivial to deal with, results are often ugly, let's ignore this.
        if (starts.some((pos) => pos.head.ch !== pos.anchor.ch)) {
          // tslint:disable-next-line:no-console
          console.log('Ignored attempt to delete subword!');
          return;
        }
        // CAV: To make sure when we undo this operation, we have carets showing in
        //      their rightful positions.
        cEditor.execCommand('goSubwordLeft');
        const ends = doc.listSelections();
        doc.setSelections(starts);
        if (starts.length !== ends.length) {
          // NOTE: Edge case where select are part of the same subword, need more thoughts on this.)
          // tslint:disable-next-line:no-console
          console.log(
            'Inogred attempt to delete subword, because some selection is part of the same subword'
          );
          return;
        }
        cEditor.operation(() => {
          for (let i = 0; i < starts.length; i++) {
            doc.replaceRange('', starts[i].head, ends[i].head, '+delete');
          }
        });
      },
      label: 'Subward backward deletion',
    });
    commands.addKeyBinding({
      command: 'sublime:subword-backward-deletion',
      keys: ['F3'],
      selector: '.CodeMirror-focused',
    });

    commands.addCommand('sublime:subword-forward-deletion', {
      execute: () => {
        const cEditor = (this.tracker.activeCell.editor as CodeMirrorEditor)
          .editor;
        const doc = cEditor.getDoc();
        const starts = doc.listSelections();
        // NOTE: This is non-trivial to deal with, results are often ugly, let's ignore this.
        if (starts.some((pos) => pos.head.ch !== pos.anchor.ch)) {
          // tslint:disable-next-line:no-console
          console.log('Ignored attempt to delete subword!');
          return;
        }
        // CAV: To make sure when we undo this operation, we have carets showing in
        //      their rightful positions.
        cEditor.execCommand('goSubwordRight');
        const ends = doc.listSelections();
        doc.setSelections(starts);
        if (starts.length !== ends.length) {
          // NOTE: Edge case where select are part of the same subword, need more thoughts on this.)
          // tslint:disable-next-line:no-console
          console.log(
            'Inogred attempt to delete subword, because some selection is part of the same subword'
          );
          return;
        }
        cEditor.operation(() => {
          for (let i = 0; i < starts.length; i++) {
            doc.replaceRange('', starts[i].head, ends[i].head, '+delete');
          }
        });
      },
      label: 'Subward forward deletion',
    });
    commands.addKeyBinding({
      command: 'sublime:subword-forward-deletion',
      keys: ['Alt Delete'],
      selector: '.CodeMirror-focused',
    });
  }

  private onActiveCellChanged(): void {
    const activeCell = this.tracker.activeCell;
    if (activeCell !== null) {
      (activeCell.editor as CodeMirrorEditor).setOption('keyMap', 'sublime');
    }
  }
}

/**
 * Initialization data for the command palette example.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'command-palette',
  autoStart: true,
  requires: [ICommandPalette, INotebookTracker],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    tracker: INotebookTracker
  ) => {
    const a = new JupyterLabSublime(app, palette, tracker);
    console.log(a);
    // a.hello();

    const { commands } = app;

    const command = 'jlab-examples:command-palette';

    // Add a command
    commands.addCommand(command, {
      label: 'Execute jlab-examples:command-palette Command',
      caption: 'Execute jlab-examples:command-palette Command',
      execute: (args: any) => {
        var text = (app as any).paths.directories.serverRoot;
        navigator.clipboard.writeText(text).then(
          function () {
            console.log('Async: Copying to clipboard was successful!');
          },
          function (err) {
            console.error('Async: Could not copy text: ', err);
          }
        );
        // console.log('the JupyterLab main application directories:', (app as any).paths);
      },
    });

    // Add the command to the command palette
    const category = 'Extension Examples';
    palette.addItem({ command, category, args: { origin: 'from palette' } });
  },
};

export default extension;
