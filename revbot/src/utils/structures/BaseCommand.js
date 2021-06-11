module.exports = class BaseCommand {
  constructor(name, category, aliases, name, description) {
    this.name = name;
    this.category = category;
    this.aliases = aliases;
    this.name = name;
    this.description = description;
  }
}