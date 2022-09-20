import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { ICommandPalette } from '@jupyterlab/apputils';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';

import '../style/index.css';

class JupyterLabSublime {
  private tracker: INotebookTracker;
  private app: JupyterFrontEnd;
  private palette: ICommandPalette;
  private panel: NotebookPanel;

  constructor(
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    tracker: INotebookTracker,
    panel: NotebookPanel
  ) {
    this.app = app;
    this.tracker = tracker;
    this.palette = palette;
    this.panel = panel;
    console.log(this.panel);
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

  private map(key: string, cmd: string, selector: string) {
    this.app.commands.addKeyBinding({
      command: cmd,
      keys: [key],
      selector: selector,
    });
  }

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
    this.map(key, jlCmd, '.CodeMirror-focused');
  }

  // private bodyMap(key: string, cmd: string) {
  // this.map(key, cmd, 'body');
  // }

  private mapp(array: Array<string>) {
    var mode = array[0];
    var n = 2;
    var chunks = [];
    for (var i = 1; i < array.length; i += n) {
      chunks[chunks.length] = array.slice(i, i + n);
    }
    for (var i = 0; i < chunks.length; i += 1) {
      this.map(chunks[i][0], chunks[i][1], mode);
    }
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
    let editorExec = this.editorExec.bind(this);
    let addCommand = this.addCommand.bind(this);

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

    commands.addCommand('cm:bow_left', {
      execute: () => {
        editorExec('goWordLeft');
        editorExec('goWordRight');
        editorExec('goWordLeft');
      },
    });

    commands.addCommand('cm:bow_right', {
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

    addCommand('ak:cwd', () => {
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
    addCommand('ak:eval-insert', () => {
      commands.execute('notebook:run-cell');
      commands.execute('notebook:enter-edit-mode');
    });

    addCommand('ak:eval-down-insert', () => {
      commands.execute('notebook:run-cell');
      commands.execute('notebook:move-cursor-down');
      commands.execute('notebook:enter-edit-mode');
    });

    addCommand('ak:down-insert', () => {
      // commands.execute('notebook:enter-edit-mode');
      commands.execute('notebook:enter-command-mode');
      commands.execute('notebook:move-cursor-down');
      if (this.tracker.activeCell.model.type === 'code') {
        commands.execute('notebook:enter-edit-mode');
      }
      console.log(this.tracker.activeCell);
    });

    commands.addCommand('ak:up-insert', {
      execute: () => {
        // commands.execute('notebook:enter-edit-mode');
        commands.execute('notebook:enter-command-mode');
        commands.execute('notebook:move-cursor-up');
        if (this.tracker.activeCell.model.type === 'code') {
          commands.execute('notebook:enter-edit-mode');
        }
      },
    });

    addCommand('ak:recenter', () => {
      commands.execute('notebook:enter-command-mode');
      commands.execute('notebook:move-cursor-down');
      commands.execute('notebook:move-cursor-up');
      if (this.tracker.activeCell.model.type === 'code') {
        commands.execute('notebook:enter-edit-mode');
      }
    });

    addCommand('ak:insert-cell-below', () => {
      commands.execute('notebook:insert-cell-below');
      commands.execute('notebook:enter-edit-mode');
    });

    addCommand('ak:insert-cell-above', () => {
      commands.execute('notebook:insert-cell-above');
      commands.execute('notebook:enter-edit-mode');
    });

    addCommand('ak:delete-cell', () => {
      commands.execute('notebook:delete-cell');
      if (this.tracker.activeCell.model.type === 'code') {
        commands.execute('notebook:enter-edit-mode');
      }
    });

    addCommand('ak:close-other', () => {
      commands.execute('application:activate-next-tab-bar');
      setTimeout(() => {
        commands.execute('application:close');
      }, 100);
    });

    addCommand('ak:test', () => {
      console.log('test');
      var cell = this.tracker.activeCell;
      if (cell.model.type === 'code') {
        console.log('CODE CODE CODE');
      }

      // this.app.commands.execute('notebook:enter-edit-mode');
      // this.app.commands.execute('notebook:move-cursor-down');
    });

    this.cmMap('Ctrl ArrowLeft', 'cm:bow_left');
    this.cmMap('Ctrl ArrowRight', 'cm:bow_right');
    this.cmMap('Alt ArrowLeft', ':goSubwordLeft');
    this.cmMap('Alt ArrowRight', ':goSubwordRight');
    this.cmMap('PageDown', 'cm:nlines_down');
    this.cmMap('PageUp', 'cm:nlines_up');
    this.cmMap('Accel Shift D', ':duplicateLine');
    this.cmMap('Ctrl ArrowDown', ':addCursorToNextLine');
    this.cmMap('Ctrl ArrowUp', ':addCursorToPrevLine');
    this.cmMap('Ctrl M', ':goToBracket');

    this.mapp([
      'body',
      'Ctrl Shift P',
      'apputils:activate-command-palette',
      'Ctrl Alt Shift C',
      'ak:cwd',
      'Alt Shift R',
      'application:close',
      'Ctrl Tab',
      'application:activate-next-tab',
      'Ctrl Shift Tab',
      'application:activate-previous-tab',
      'Ctrl F8',
      'ak:down-insert',
      'Ctrl F9',
      'ak:up-insert',
      'Ctrl F10',
      'ak:recenter',
      'Ctrl Alt Shift B',
      'ak:insert-cell-below',
      'Ctrl Alt Shift A',
      'ak:insert-cell-above',
      'Ctrl Alt Shift D',
      'ak:delete-cell',

      'Alt Shift F12',
      'application:toggle-mode',
      'Alt F12',
      'notebook:run-in-console',
      'Ctrl F12',
      'ak:close-other',
      'Ctrl Shift F12',
      'application:close',
      'Ctrl Alt F12',
      'application:activate-next-tab-bar',
      'Ctrl Alt Shift F12',
      'application:activate-previous-tab-bar',
      'F2',
      'docmanager:rename',

      // 'Ctrl Alt Shift F12', 'statusbar:toggle',
    ]);

    this.mapp([
      '.jp-Notebook.jp-mod-editMode',
      'Ctrl Enter',
      'ak:eval-insert',
      'Shift Enter',
      'ak:eval-down-insert',
    ]);

    this.mapp([
      '.jp-Notebook:focus',
      'E',
      'notebook:enter-edit-mode',
      'H',
      'notebook:move-cursor-down',
      'T',
      'notebook:move-cursor-up',
    ]);

    // [data-jp-kernel-user]:focus
    // jp-Terminal
    // jp-SideBar
    // jp-SettingEditor
    // jp-Notebook
    // jp-InputArea-editor
    // jp-ImageViewer
    // jp-FileEditor
    // jp-DirListing-item
    // jp-DirListing-content
    // jp-CodeConsole-promptCell
    // jp-CodeConsole-content
    // jp-CodeConsole
    // jp-CodeCell
    // jp-Cell
    // jp-Activity
    //.body:not(.jp-DocumentSearch-overlay)
    // #id-4ed43c18-2f75-4d2b-b628-17665194ca88 > div.lm-Widget.p-Widget.jp-DocumentSearch-overlay

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
    tracker: INotebookTracker,
    panel: NotebookPanel
  ) => {
    const a = new JupyterLabSublime(app, palette, tracker, panel);
    console.log(a);
  },
};

export default extension;
