import { StringDecoder } from 'node:string_decoder';

/*
 * Streaming CSV reader for the legacy-project export.
 *
 * The project_definition field is a JSON string and can contain commas,
 * escaped quotes and embedded newlines, so this is a small RFC 4180 state
 * machine rather than a split-on-comma parser. The stream is consumed chunk
 * by chunk and rows are yielded as soon as they are complete; the whole file
 * is never buffered.
 *
 * The reader is deliberately strict about an unclosed quoted field at EOF:
 * silently dropping the last record would make an audit look cleaner than it
 * is. Header validation is left to the caller.
 */
export async function* readCsvRows(stream, options = {}) {
    const delimiter = options.delimiter || ',';
    const quote = options.quote || '"';
    const decoder = new StringDecoder('utf8');
    let field = '';
    let row = [];
    let in_quotes = false;
    let quote_pending = false;
    let skip_lf = false;
    let completed = [];

    const finish_row = () => {
        row.push(field);
        field = '';

        // Blank lines are not projects. A row with two empty fields is kept
        // so the caller can report the malformed record.
        if (!(row.length === 1 && row[0] === '')) {
            completed.push(row);
        }

        row = [];
    };

    const process_text = (text) => {
        for (let index = 0; index < text.length; index += 1) {
            const character = text[index];

            if (in_quotes) {
                if (quote_pending) {
                    if (character === quote) {
                        field += quote;
                        quote_pending = false;
                        continue;
                    }

                    // The previous quote closed the field; handle this
                    // character in the unquoted state.
                    quote_pending = false;
                    in_quotes = false;
                } else if (character === quote) {
                    // Could be the closing quote or the first half of an
                    // escaped quote. The next character decides.
                    quote_pending = true;
                    continue;
                } else {
                    field += character;
                    continue;
                }
            }

            if (skip_lf) {
                skip_lf = false;

                if (character === '\n') {
                    continue;
                }
            }

            if (character === quote) {
                if (field.length === 0) {
                    in_quotes = true;
                    quote_pending = false;
                } else {
                    // A quote in an unquoted field is malformed CSV; keep it
                    // so JSON.parse reports the actual damaged value.
                    field += character;
                }
                continue;
            }

            if (character === delimiter) {
                row.push(field);
                field = '';
                continue;
            }

            if (character === '\n' || character === '\r') {
                finish_row();

                if (character === '\r') {
                    skip_lf = true;
                }
                continue;
            }

            field += character;
        }
    };

    for await (const chunk of stream) {
        process_text(typeof chunk === 'string' ? chunk : decoder.write(chunk));

        if (completed.length) {
            const rows = completed;
            completed = [];

            for (const completed_row of rows) {
                yield completed_row;
            }
        }
    }

    process_text(decoder.end());

    if (in_quotes && !quote_pending) {
        throw new Error('CSV ended inside a quoted field');
    }

    if (quote_pending) {
        quote_pending = false;
        in_quotes = false;
    }

    if (field.length > 0 || row.length > 0) {
        finish_row();
    }

    for (const completed_row of completed) {
        yield completed_row;
    }
}
