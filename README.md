# Gowork

Gowork is CLI program that uses templates to make the desired file easier. If you set up templates for frequently created files, you can create files by inserting only the necessary values into the CLI.

## How to use?

### `install`

```
$ yarn install --dev gowork
$ gowork init
```

### `create template`

If you used the init command, you would have created a **templates directory**. The **Component.jsx template** will basically be contained.

```
function $0($1) {
  return /$2:return data/;
}
```

**$0** means the name of the file. From **$1** onwards, it corresponds to the property in order. The same number may be more than one. There is no number limit.

Basically, it takes the form of **$N**, but if you want to display the meaning of a particular property, you can use the form **/$N:description/**. It is convenient when using the CLI.

### `gowork using command`

```
$ gowork <template> <targetDirectory> <fileName> <$1> ...
```

What matters is the order. Template name excluding suffix, counterpart address-based directory to create new files, file name, Property1, Property2... For example, it is as follows.

```
e.g) $ gowork Component src/components Button title color
```

This is almost everything!

### `gowork using CLI`

If you follow the order well, the CLI will take good care of you even if you skip a few of the elements behind you. If you didn't skip the values that would go in the middle, there's nothing to worry about.

```
$ gowork Template1 src/components Button first_param
$ Please choose which template to use
> Template 1
  Template 2
```

```
$ gowork
$ Please input for second_parameter : _
```

### `configuration`

1. **defaultTemplate**: \<templateName>

   Specifies the template to use by default. When using the **-d flag** together, the default template and the default target directory are used.

   ```
   $ gowork -d Button <param1> ...
   ```

2. **defaultTargetDirectory**: \<relativeDirectoryPath>

   Specifies the target directory to use by default. When using the **-d flag** together, the default template and the default target directory are used.

   ```
   $ gowork -d Button <param1> ...
   ```

3. **templates**: {[templateName]: [targetDirectory]}

   It's in the form of json format. Use the template name as the key, and specify the target directory for the template as the value.

   If a command is used without designating a target directory, it is used if there is a predetermined target directory.

   ```
   $ gowork Button
   ? Please input which file name to create : _
   ```

## Update Plan

Currently, the basic suffix of the file to be generated may be specified through the configuration file's suffix option. Or you have to enter it yourself. It plans to change it to be created based on the suffix of the template file.

## Contribute

It is managed in the repository below.

```
https://github.com/eunhyulkim/gowork
```

I want to provide various basic templates to users. I want to create templates not only for react components, but also for unittest or many frequently used patterns.

If you have any other problems, please email valhalla.host@gmail.com.
