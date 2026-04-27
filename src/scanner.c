#include "tree_sitter/parser.h"
#include "tree_sitter/alloc.h"

enum TokenType {
    START_OF_DIRECTIVE,
    NEWLINE,
    END_OF_DIRECTIVE,
    LINE_COMMENT_CONTENT,
    BLOCK_COMMENT_CONTENT,
};

void* tree_sitter_cpp_external_scanner_create() {
    return ts_malloc(sizeof(bool));
}

void tree_sitter_cpp_external_scanner_destroy(void* payload) {
    ts_free(payload);
}

unsigned tree_sitter_cpp_external_scanner_serialize(
    void* payload,
    char* buffer
) {
    buffer[0] = *(bool*) payload;
    return 1;
}

void tree_sitter_cpp_external_scanner_deserialize(
    void* payload,
    const char* buffer,
    unsigned length
) {
    if (length == 0) {
        *(bool*) payload = false;
        return;
    }
    *(bool*) payload = buffer[0];
}

static inline bool is_whitespace(int character) {
    return character == ' ' || character == '\t' || character == '\v' || character == '\f';
}

bool tree_sitter_cpp_external_scanner_scan(
    void* payload,
    TSLexer* lexer,
    const bool* valid_symbols
) {
    bool* is_directive = (bool*) payload;
    if (valid_symbols[START_OF_DIRECTIVE]) {
        lexer->result_symbol = START_OF_DIRECTIVE;
        *is_directive = true;
        return true;
    }
    while(is_whitespace(lexer->lookahead)) {
        lexer->advance(lexer, true);
    }

    if (valid_symbols[LINE_COMMENT_CONTENT]) {
        lexer->result_symbol = LINE_COMMENT_CONTENT;
        while(!lexer->eof(lexer)) {
            if(lexer->lookahead == '\n') {
                return true;
            }
            if(is_whitespace(lexer->lookahead)) {
                lexer->advance(lexer, false);
                continue;
            }
            if(lexer->lookahead == '\\') {
                lexer->advance(lexer, false);
                continue;
            }
            lexer->advance(lexer, false);
            lexer->mark_end(lexer);
        }
        return true;
    }

    if (valid_symbols[BLOCK_COMMENT_CONTENT]) {
        lexer->result_symbol = BLOCK_COMMENT_CONTENT;
        bool found_star = false;
        while(!lexer->eof(lexer)) {
            if (found_star && lexer->lookahead == '/') {
                return true;
            }
            found_star = lexer->lookahead == '*';
            lexer->advance(lexer, false);
            if(!found_star) {
                lexer->mark_end(lexer);
            }
        }
        return true;
    }

    if ((valid_symbols[NEWLINE] || valid_symbols[END_OF_DIRECTIVE]) && lexer->lookahead == '\n') {
        if (*is_directive) {
            if (!valid_symbols[END_OF_DIRECTIVE]) {
                return false;
            }
            lexer->result_symbol = END_OF_DIRECTIVE;
            *is_directive = false;
        } else {
            lexer->result_symbol = NEWLINE;
        }
        lexer->advance(lexer, false);
        return true;
    }

    return false;
}