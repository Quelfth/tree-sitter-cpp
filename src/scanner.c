#include "tree_sitter/parser.h"
#include "tree_sitter/alloc.h"

enum TokenType {
    START_OF_DIRECTIVE,
    NEWLINE,
    END_OF_DIRECTIVE,
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

    if (valid_symbols[NEWLINE] || valid_symbols[END_OF_DIRECTIVE]) {
        if (lexer->lookahead == '\n') {
            if (*is_directive) {
                lexer->result_symbol = END_OF_DIRECTIVE;
                *is_directive = false;
            } else {
                lexer->result_symbol = NEWLINE;
            }
            return true;
        }
    }

    return false;
}