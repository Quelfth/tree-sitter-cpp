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
        translation_unit: $ => repeat(
            $._declaration,
        ),

        _declaration: $ => choice(
            $.function_declaration,
            $.empty_declaration,
            $._statement_declaration,
        ),

        _statement_declaration: $ => choice(
            $.variable_declaration,
        ),

        empty_declaration: $ => seq(repeat($._attributes), ";"),

        function_declaration: $ => seq(
            $._declaration_type_modifiers,
            $._function_declarator,
            $._parameters_with_modifiers,
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
            repeat(choice(
                $.function_type_modifier,
                $.array_type_modifier,
            )),
        ),

        parenthesized_function_declarator: $ => seq("(", $._function_declarator, ")"),


        _function_body: $ => $.block, // Add try body


        variable_declaration: $ => seq(
            $._declaration_type_modifiers,
            $._variable_declarator,
            optional($._variable_initializer),
            repeat(seq(
                ",",
                $._variable_declarator,
                optional($._variable_initializer),
            )),
            ";",
        ),


        _variable_declarator: $ => seq(
            repeat($._any_pointer_modifier),
            choice(seq(optional($.scope), $.name), $.parenthesized_variable_declarator),
        ),

        parenthesized_variable_declarator: $ => seq("(", $._variable_declarator, ")"),

        _variable_initializer: $ => choice(
            seq("=", $._initializer),
            seq("(", $._initializers, ")"),
            $.initializer_list,
        ),

        _empty_declaration: $ => seq(repeat($._attributes), ";"),

        _type_postfix: $ => seq(
            repeat($._any_pointer_modifier),
            optional($.parenthesized_type_postfix),
        ),

        parenthesized_type_postfix: $ => seq("(", $._type_postfix, ")"),
        
        _declaration_type_modifiers: $ => seq(
            repeat($._attributes),
            repeat($._declaration_modifier),
            $._type_modifier,
            repeat(choice($._declaration_modifier, $._type_modifier)),
            repeat($._attributes),
        ),

        _template_modifier: $ => seq(
            "template",
            optional($.template_parameters),
        ),

        template_parameters: $ => seq(
            "<",
            optional(seq($._template_parameter, repeat(seq(",", $._template_parameter)))),
            ">",
        ),

        _template_parameter: $ => choice(
            $.parameter,
            $.type_parameter,
        ),

        type_parameter: $ => choice(
            optional($._template_modifier),
            choice("class", "typename"), optional("..."),
            optional($.name),
            optional(seq("=", $._type)),
        ),

        _parameters_with_modifiers: $ => seq(
            $.parameters,
            repeat($._attributes),
            repeat($._const_or_volatile_modifier),
            repeat($._any_reference_modifier),
        ),

        parameters: $ => seq("(", ")"),

        trailing_return_type: $ => seq("->", $._type),

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
            $.break_statement,
            $.continue_statement,
            $.return_statement,
            $.goto_statement,
            $._statement_declaration,
            $.try_block,
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
                    optional($._expr), ";",
                    optional($._expr),
                ),
                seq(
                    $._declar_modifiersation_type,
                    $._variable_declarator,
                    ":",
                    choice(
                        $._expr,
                        $.initializer_list,
                    ),
                ),
            ),
            ")",
            $._statement,
        ),

        break_statement: $ => seq("break", ";"),
        continue_statement: $ => seq("continue", ";"),
        return_statement: $ => seq(
            "return",
            optional(choice($._expr, $.initializer_list)),
            ";",
        ),
        goto_statement: $ => seq("goto", $.name, ";"),

        try_block: $ => seq(
            "try", $._lbrace,
            repeat($._statement),
            $._rbrace,
            repeat(
                "catch", "(",
                choice(
                    seq(
                        repeat($._attributes),
                        $._declar_modifiersation_type,
                        choice($._variable_declarator, $._type_postfix),
                    ),
                    "...",
                ),
                ")",
                $._lbrace,
                repeat($._statement),
                $._rbrace,
            ),
        ),

        _expr_or_init: $ => choice($._expr, $.initializer_list),

        _expr: $ => choice(
            $.binary_expression,
            $.assignment_expression,
            $.cast_expression,
            $.pre_unary_expression,
            $.post_unary_expression,
            $.sizeof_expression,
            $.sizeof_type_expression,
            $.sizeof_variadic_expression,
            $.alignof_expression,
            $.noexcept_expression,
            $.new_exprssion,
            $.delete_expression,
            $.index_expression,
        ),

        binary_expression: $ => choice(
            seq($._expr, ",", $._expr),
            seq($._expr, $._2bar, $._expr),
            seq($._expr, $._2amper, $._expr),
            seq($._expr, $._bar, $._expr),
            seq($._expr, $._caret, $._expr),
            seq($._expr, $._amper, $.expr),
            seq($._expr, "==", $._expr),
            seq($._expr, "!=", $._expr),
            seq($._expr, "<", $._expr),
            seq($._expr, ">", $._expr),
            seq($._expr, "<=", $._expr),
            seq($._expr, ">=", $._expr),
            seq($._expr, "<<", $._expr),
            seq($._expr, ">>", $._expr),
            seq($._expr, "+", $._expr),
            seq($._expr, "-", $._expr),
            seq($._expr, "*", $._expr),
            seq($._expr, "/", $._expr),
            seq($._expr, "%", $._expr),
            seq($._expr, ".*", $._expr),
            seq($._expr, "->*", $._expr),
        ),

        assignment_expression: $ => choice(
            seq($._expr, "=", $._expr_or_init),
            seq($._expr, "*=", $._expr_or_init),
            seq($._expr, "/=", $._expr_or_init),
            seq($._expr, "%=", $._expr_or_init),
            seq($._expr, "+=", $._expr_or_init),
            seq($._expr, "-=", $._expr_or_init),
            seq($._expr, ">>=", $._expr_or_init),
            seq($._expr, "<<=", $._expr_or_init),
            seq($._expr, $._amper_eq, $._expr_or_init),
            seq($._expr, $._caret_eq, $._expr_or_init),
            seq($._expr, $._bar_eq, $._expr_or_init),
        ),

        cast_expression: $ => seq("(", $._type, ")", $._expr),

        pre_unary_expression: $ => choice(
            seq("++", $._expr),
            seq("--", $._expr),
            seq("*", $._expr),
            seq($._amper, $._expr),
            seq("+", $._expr),
            seq("-", $._expr),
            seq($._bang, $._expr),
            seq($._tilde, $._expr), 
        ),

        sizeof_expression: $ => seq("sizeof", $._expr),
        sizeof_type_expression: $ => seq("sizeof", "(", $._type, ")"),
        sizeof_variadic_expression: $ => seq("sizeof", "...", "(", $.name, ")"),

        alignof_expression: $ => seq("alignof", "(", $._type, ")"),

        noexcept_expression: $ => seq(
            "noexcept",
            "(", $._expr, ")",
        ),

        new_expression: $ => seq(
            optional("::"),
            "new",
            optional(seq("(", $._initializers, ")")),
            choice($._type, seq("(", $._type, ")")),
            choice(
                seq("(", $._initializers, ")"),
                $.initializer_list,
            ),
        ),

        delete_expression: $ => seq(
            optional("::"),
            "delete",
            optional($._lbracket, $._rbracket),
            $._expr,
        ),

        index_expression: $ => seq($._expr, $._lbracket, optional($._expr_or_init), $._rbracket),

        call_expression: $ => seq(choice($._expr, $._weak_type), "(", optional($._initializers), ")"),
        struct_initializer: $ => seq($._weak_type, $.initializer_list),

        member_expression: $ => seq($._expr, choice(".", "->"), optional("template"), $._any_name),

        postfix_expression: $ => choice(
            seq($._expr, "++"),
            seq($._expr, "--"),
        ),

        specific_cast_expression: $ => seq(
            choice(
                "dynamic_cast",
                "static_cast",
                "reinterpret_cast",
                "const_cast",
            ),
            "<", $._type, ">",
            "(", $._expr, ")",
        ),

        typeid_expression: $ => seq(
            "typeid", "(",
            choice($._expr, $._type),
            ")",
        ),

        _type: $ => choice(
            $.function_type,
            $.array_type,
            $._type_left,
        ),

        function_type: $ => seq(
            $._type,
            $._parameters_with_modifiers,
        ),

        array_type: $ => seq(
            $._type,
            $._lbracket, optional($._expr), $._rbracket,
            repeat($._attributes),
        ),

        _type_left: $ => choice(
            $.pointer_type,
            $.reference_type,
            $.rvalue_reference_type,
            $.pointer_to_member_type,
            seq($._type_root, repeat($._attributes)),
        ),

        pointer_type: $ => seq($._type_left, "*"),
        reference_type: $ => seq($._type_left, $._amper),
        rvalue_reference_type: $ => seq($._type_left, $._2amper),
        pointer_to_member_type: $ => seq($._type_left, $.scope, "*"),

        _type_root: $ => choice(
            $.primitive_type_name,
            $.short_type,
            $.long_type,
            $.signed_type,
            $.unsigned_type,
            $.const_type,
            $.specified_type_name,
            $.scoped_type_name,
            $.type_name,
            $.decltype,
        ),

        short_type: $ => choice(
            seq("short", $._type_root),
            "short",
            seq($._type_type, "short"),
        ),

        long_type: $ => choice(
            seq("long", $._type_root),
            "long",
            seq($._type_root, "long"),
        ),

        signed_type: $ => choice(
            seq("signed", $._type_root),
            "signed",
            seq($._type_root, "signed"),
        ),

        unsigned_type: $ => choice(
            seq("unsigned", $._type_root),
            "unsigned",
            seq($._type_root, "unsigned"),
        ),

        const_type: $ => choice(
            seq("const", $._type_root),
            seq($._type_root, "const"),
        ),

        volatile_type: $ => choice(
            seq("volatile", $._type_root),
            seq($._type_root, "volatile"),
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

        function_type_modifier: $ => seq($._parameters_with_modifiers),
        array_type_modifier: $ => seq($._lbracket, $._expr, $._rbracket, repeat($._attributes)),

        const_modifier: $ => "const",
        volatile_modifier: $ => "volatile",

        _declaration_modifier: $ => choice(
            $.register_modifier,
            $.static_modifer,
            $.thread_local_modifier,
            $.extern_modifier,
            $.mutable_modifier,
            $.inline_modifier,
            $.virtual_modifier,
            $.explicit_modifier,
        ),

        register_modifier: $ => "register",
        static_modifer: $ => "static",
        thread_local_modifier: $ => "thread_local",
        extern_modifier: $ => "extern",
        mutable_modifier: $ => "mutable",
        inline_modifier: $ => "inline",
        virtual_modifier: $ => "virtual",
        explicit_modifier: $ => "explicit",

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

        attribute_arguments: $ => seq("(", repeat($._meta_token), ")"),

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

        _weak_type: $ => choice(
            $.scoped_type_name,
            $.type_name,
            $.primitive_type_name,
            alias($.primitive_type_modifier, $.primitive_type_name),
            $.typename,
            $.decltype,
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

        specified_type_name: $ => seq(
            field("specifier", $.type_specifier),
            field("name", choice($.type_name, $.scoped_type_name)),
        ),

        typename: $ => seq(
            "typename",
            choice($.type_name, $.scoped_type_name),
        ),

        template_type_name: $ => seq(
            optional("template"),
            $.type_name,
            $.template_arguments,
        ),

        template_name: $ => seq(
            optional("template"),
            $.name,
            $.template_arguments,
        ),
        
        template_operator_name: $ => seq(
            optional("template"),
            $.operator_name,
            $.template_arguments,
        ),

        template_destructor_name: $ => seq(
            optional("template"),
            $.destructor_name,
            $.template_arguments,
        ),

        _any_name: $ => choice(
            $.scoped_name,
            $.name,
            $.scoped_operator_name,
            $.operator_name,
            $.scoped_destructor_name,
            $.destructor_name,
        ),

        operator_name: $ => seq(
            "operator",
            choice(
                $.overloadable_operator,
                seq('""', alias($.literal_suffix, $.name)),
                alias($._type, $.conversion_operator_type),
            ),
        ),

        destructor_name: $ => seq("~", $.type_name),

        scope: $ => seq(optional(field("scope", choice($.name, $.scoped_name))), "::"),

        scoped_type_name: $ => seq(optional(field("scope", choice($.name, $.scoped_name))), "::", field("name", choice($.type_name, $.template_type_name))),
        scoped_name: $ => seq(optional(field("scope", choice($.name, $.scoped_name))), "::", field("name", $.name)),
        scoped_operator_name: $ => seq(optional(field("scope", choicce($.name, $.scoped_name))), "::", field("name", $.operator_name)),
        scoped_destructor_name: $ => seq(optional(field("scope", choicce($.name, $.scoped_name))), "::", field("name", $.destructor_name)),

        name: $ => $.identifier,

        type_name: $ => $.identifier,

        overloadable_operator: $ => choice(
            "new",
            "delete",
            seq("new", $._lbracket, $._rbracket),
            seq("delete", $._lbracket, $._rbracket),
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
            seq("(", ")"),
            seq($._lbracket, $._rbracket),
        ),

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
