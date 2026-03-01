/**
 * @file C++ Grammar designed to be easy to query.
 * @author Quelfth <quelfth@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
    name: "cpp",

    rules: {
        translation_unit: $ => seq(
            $._declaration,
        ),

        _declaration: $ => choice(
            $.function_declaration,
        ),

        function_declaration: $ => seq(
            repeat($._attributes),
            repeat($._declaration_modifier),
            $._type_modifier,
            repeat(choice($._declaration_modifier, $._type_modifier)),
            repeat($._attributes),
            $._function_declarator,
            $.parameters,
            repeat($._attributes),
            repeat($._const_or_volatile_modifier),
            repeat($._any_reference_modifier),
            optional($.trailing_return_type),
            choice(
                ";",
                $._function_body,
                seq("=", choice(
                    "0",
                    "default",
                    "delete",
                )),
            ),
        ),

        _function_declarator: $ => seq(
            repeat($._any_pointer_modifier),
            choice(seq(optional($.scope), $.name), $.parenthesized_function_declarator),
        ),

        parenthesized_function_declarator: $ => seq("(", $._function_declarator, ")"),


        _function_body: $ => $.block, // Add try body


        variable_declaration: seq(
            repeat($._attributes),
            repeat($._declaration_modifier),
            $._type_modifier,
            repeat(choice($._declaration_modifier, $._type_modifier)),
            repeat($._attributes),
            $._variable_declarator,
            optional($._variable_initializer),
            repeat(
                ",",
                $._variable_declarator,
                optional($._variable_initializer),
            ),
            ";",
        ),

        _variable_declarator: $ => seq(
            repeat($._any_pointer_modifier),
            choice(seq(optional($.scope), $.name), $.parenthesized_variable_declarator),
        ),

        _variable_initializer: $ => choice(
            seq("=", $._initializer),
            seq("(", $._initializers, ")"),
            $.initializer_list,
        ),

        _initializers: $ => seq($._initializer, optional("..."), repeat(",", $._initializer, optional("..."))),

        _initializer: $ => choice(
            $.initializer_list,
            $._expr,
        ),

        initializer_list: $ => seq(
            $._lbrace,
            $._initializers,
            $._rbrace,
        ),

        block: $ => seq($._lbrace, repeat($._statement), $._rbrace),

        _statement: $ => choice(
            $.labeled_statement,
            $.expression_statement,
            $.empty_statement,
            $.block,
            $.if_statement,
            $.switch_statement,
            $.while_statement,
            $.for_statement,
        ),

        labeled_statement: $ => seq(
            repeat($._attributes),
            choice(
                $.name,
                "case", $._expr,
                "default",
            ),
            ":",
            $._statement,
        ),

        expression_statement: $ => seq($._expr, ";"),

        empty_statement: $ => ";",

        if_statement: $ => seq(
            "if", "(",
            $._expr,
            ")",
            $._statement,
            optional(seq(
                "else",
                $._statement,
            )),
        ),

        switch_statement: $ => seq(
            "switch", "(",
            $._expr,
            ")",
            $._statement,
        ),

        while_statement: $ => choice(
            seq(
                "while", "(",
                $._expr,
                ")",
                $._statement,
            ),
            seq(
                "do",
                $._statement,
                "while", "(",
                $._expr,
                ")", ";",
            ),
        ),

        for_statement: $ => choice(
            "for", "(",
            choice(
                seq(
                    choice(
                        $.expression_statement,
                        $.variable_declaration,
                    ),

                ),
            ),
        ),

        _any_pointer_modifier: $ => choice(
            $.pointer_modifier,
            $.reference_modifier,
            $.rvalue_reference_modifier,
            $.pointer_to_member_modifier,
        ),

        _any_reference_modifier: $ => choice(
            $.reference_modifier,
            $.rvalue_reference_modifier,
        ),

        _const_or_volatile_modifier: $ => choice(
            $.const_modifier,
            $.volatile_modifier,
        ),

        pointer_modifier: $ => "*",
        reference_modifier: $ => $._amper,
        rvalue_reference_modifier: $ => $._2amper,

        pointer_to_member_modifier: $ => seq(optional($.name, $.scoped_name), "::", "*"),

        const_modifier: $ => "const",
        volatile_modifier: $ => "volatile",

        _type_modifier: $ => choice(
            $._simple_type_modifier,
            $._specified_type_name,
            $._const_or_volatile_modifier,
        ),

        _simple_type_modifier: $ => choice(
            $.type_name,
            $.scoped_type_name,
            $._primitive_type_modifier,
            $._primitive_type_name,
            $.decltype,
        ),

        _attributes: $ => choice(
            $.attribute_modifier,
            $.alignas_modifier,
        ),

        attribute_modifier: $ => seq(
            $._lbracket, $._lbracket,
            repeat($.attribute),
            $._rbracket, $._rbracket,
        ),

        attribute: $ => seq(
            optional(field("namespace", $.name)),
            field("name", alias($.name, $.attribute_name)),
            optional(field("arguments", $.attribute_arguments)),
        ),

        attribute_arguments: seq("(", repeat($._meta_token), ")"),

        _meta_token: $ => choice(
            $.identifier_token,
            alias($.integer, $.integer_token),
            alias($.float, $.float_token),
            alias($.string, $.string_token),
            alias($.character, $.character_token),
            $.operator_token,
            $.delimited_token,
        ),

        identifier_token: $ => $.identifier,

        delimited_token: $ => choice(
            seq("(", repeat($._meta_token), ")"),
            seq("[", repeat($._meta_token), "]"),
            seq("{", repeat($._meta_token), "}"),
        ),

        operator_token: $ => choice(
            $._hash,
            $._2hash,
            ";",
            ":",
            "...",
            "?",
            "::",
            ".",
            ".*",
            "+",
            "-",
            "*",
            "/",
            "%",
            $._caret,
            $._amper,
            $._bar,
            $._tilde,
            $._bang,
            "=",
            "<",
            ">",
            "+=",
            "-=",
            "*=",
            "/=",
            "%=",
            $._caret_eq,
            $._amper_eq,
            $._bar_eq,
            "<<",
            ">>",
            "<<=",
            ">>=",
            "==",
            $._bang_eq,
            "<=",
            ">=",
            $._2amper,
            $._2bar,
            "++",
            "--",
            ",",
            "->*",
            "->",
        ),

        primitive_type_modifier: $ => choice(
            "short",
            "long",
            "signed",
            "unsigned",
        ),

        primitive_type_name: $ => choice(
            "char",
            "char16_t",
            "char32_t",
            "wchar_t",
            "bool",
            "int",
            "float",
            "double",
            "void",
            "auto",
        ),

        type_specifier: $ => choice(
            "class",
            "enum",
            "struct",
            "typename",
            "union",
        ),

        integer: $ => /[0-9]+/,
        float: $ => /[0-9]+.[0-9]*/,
        string: $ => seq(
            '"',
            repeat($.string_content),
            '"',
        ),
        string_content: $ => /[^"]*/,
        character: $ => seq(
            "'",
            $.character_content,
            "'",
        ),
        character_content: $ => /[^']/,

        specified_type_name: seq(
            field("specifier", $.type_specifier),
            field("name", choice($.type_name, $.scoped_type_name)),
        ),

        template_type_name: seq(
            optional("template"),
            $.type_name,
            $.template_arguments,
        ),

        scope: seq(optional(field("scope", choice($.name, $.scoped_name))), "::"),

        scoped_type_name: seq(optional(field("scope", choice($.name, $.scoped_name))), "::", field("name", choice($.type_name, $.template_type_name))),
        scoped_name: seq(optional(field("scope", choice($.name, $.scoped_name))), "::", field("name", $.name)),

        name: $ => $.identifier,

        type_name: $ => $.identifier,

        identifier: $ => /[a-zA-Z_][a-zA-Z_0-9]*/,
                
        _lbracket: $ => choice("[", alias("<:", "[")),
        _rbracket: $ => choice("]", alias(":>", "]")),
        _lbrace: $ => choice("{", alias("<%", "{")),
        _rbrace: $ => choice("}", alias("%>", "}")),

        _2amper: $ => choice("&&", alias("and", "&&")),
        _amper_eq: $ => choice("&=", alias("and_eq", "&=")),
        _amper: $ => choice("&", alias("bitand", "&")),
        _bar: $ => choice("|", alias("bitor", "|")),
        _tilde: $ => choice("~", alias("compl", "~")),
        _bang: $ => choice("!", alias("not", "!")),
        _bang_eq: $ => choice("!=", alias("not_eq", "!=")),
        _2bar: $ => choice("||", alias("or", "||")),
        _bar_eq: $ => choice("|=", alias("or_eq", "|=")),
        _caret: $ => choice("^", alias("xor", "^")),
        _caret_eq: $ => choice("^=", alias("xor_eq", "^=")),

        _hash: $ => choice("#", alias("%:", "#")),
        _2hash: $ => choice("##", alias("%:%:", "##")),

    }
});
