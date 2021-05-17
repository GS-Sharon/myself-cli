const fs = require('fs-extra')
const path = require('path')
const inquirer = require("inquirer")
const Creator = require('./Creator')
module.exports = async (projectName, options) => {
  //获取当前命令执行的工作目录
  const cwd = process.cwd();
  //判断是否存在目标文件名
  const targetDir = path.join(cwd, projectName);
  if(fs.existsSync(targetDir)) {
    //判断是否有带force
    if(options && options.force) {
      await fs.remove(targetDir);
    } else {
      const {action} = await inquirer.prompt({
        name: 'action', //结果变量名为action
        type: 'list',
        message: '已存在该文件名，是否需要强制覆盖',
        choices: [
          {
            name: 'Recover',
            value: 'recover'
          }, {
            name: 'Cancel',
            value: false
          }
        ]
      });
      //选择强制覆盖
      if(!action) {
        return;
      } else if(action == 'recover') {
        fs.remove(targetDir);
      }
    }
  }
  //  生成目标模板
  const creator = new Creator(projectName, targetDir);
  creator.create();
}