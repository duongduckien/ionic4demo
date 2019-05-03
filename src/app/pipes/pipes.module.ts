import { NgModule } from '@angular/core';

// Pipes
import { PipesUrlPipe } from './pipes-url/pipes-url';
import { PipesSafeHtmlPipe } from './pipes-safe-html/pipes-safe-html';
import { ConvertStringPipe } from './convert-string/convert-string';
import { TruncateTextPipe } from './truncatetext.pipe';
import { ConvertLinksPipe } from './convertlinks.pipe';

@NgModule({
  declarations: [
    PipesUrlPipe,
    PipesSafeHtmlPipe,
    ConvertStringPipe,
    TruncateTextPipe,
    ConvertLinksPipe
  ],
  imports: [],
  exports: [
    PipesUrlPipe,
    PipesSafeHtmlPipe,
    ConvertStringPipe,
    TruncateTextPipe,
    ConvertLinksPipe
  ]
})
export class PipesModule { }
