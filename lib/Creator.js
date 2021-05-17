const fs = require('fs-extra')
const { axios } = require('./request')
const inquirer = require("inquirer")
const ora = require('ora')
const downLoadGitRepo = require('download-git-repo')
const util = require('util')
const chalk = require('chalk')

class Creator {
  constructor(projectName, targetDir) {
    this.projectName = projectName;
    this.targetDir = targetDir;
    this.githubUser = 'GS-Sharon';
    this.repo = '';
    this.tag = ''
  }
  wrapLoading() {
    return (new Promise((resolve) => setTimeout(resolve, 1000)));
  }

  /**
   * @description: 创建loading
   * @param {*} cb  获取repos
   * @param {*} message 等待message
   */
  async createSpinner(cb, message) {
    const spinner = ora(message);
    spinner.start();
    const result = await cb();
    if(result) {
      spinner.succeed();
      return result;
    } else {
      try {
        await this.wrapLoading();
        spinner.succeed();
        //1s后重新请求
        return this.createSpinner(cb,message);
      } catch(err) {
        spinner.fail("request failed , refetching...")
      }
    }
  }

  /**
   * @description: 远程获取对应的github的所有仓库
   * @param {*}
   * @return Array
   */
  fetchRepoList = async() => {
    const repos = await (axios.get(`https://api.github.com/users/${this.githubUser}/repos`));
    return repos;
  }

  /**
   * @description: 远程获取repo对应的tag
   * @param {*}
   * @return {*}
   */
  fetchTagList = async() => {
    const tags = await (axios.get(`https://api.github.com/repos/${this.githubUser}/${this.repo}/tags`));
    return tags;
  }

  /**
   * @description: 下载模板
   * @param {*}
   * @return {*}
   */  
  async download() {
    const url = `github:${this.githubUser}/${this.repo}${this.tag ? '#' + this.tag : ''}`;
    console.log('url', url)
    const spinner = ora('正在下载模板...');
    spinner.start();
    try {
      //通过node自带的util的promisify将downLoadGitRepo由函数转为promise
      await util.promisify(downLoadGitRepo)(url, this.targetDir, function(err) {
        spinner.succeed(chalk.cyan('下载成功！'));
      });
    } catch(err) {
      spinner.fail(err)
    }
  }

  /**
   * @description: 创建目标文件
   */
  async create() {
    //在当前工作目录下生成目标文件
    fs.ensureDirSync(this.targetDir, (err) => {
      if(err) console.log(err);
    });
    // 获取仓库模板repos
    const repos = await this.createSpinner(this.fetchRepoList, '正在拉取模板中...');
    let { repo } = await inquirer.prompt({
      name: 'repo',
      type: 'list',
      choices: repos.map(item => item.name),
      message: 'choose a template for your project' //比如vue或者react的模板
    });
    this.repo = repo;
    // 根据repos获取tag
    const tags = await this.createSpinner(this.fetchTagList, '正在获取tags...');
    // 询问用户并得到选择的tag
    const { tag } = await inquirer.prompt({
      name: 'tag',
      type: 'list',
      message: '请选择版本',
      choices: tags
    });
    this.tag = tag;
    // 下载
    await this.download();
  }
}
module.exports = Creator;