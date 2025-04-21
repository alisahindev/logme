#!/usr/bin/env node

import chalk from 'chalk';
import { table } from 'table';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { LOG_CODES } from './enums/LogCodes';
import { decodeLogCode, getLogCodeDescription } from './utils/LogDecoder';
import { generateLogCode, isValidLogCode } from './utils/LogUtils';

const cli = yargs(hideBin(process.argv))
  .scriptName('logme')
  .usage('$0 <cmd> [args]')
  .command('decode <code>', 'Decode a log code to human-readable format', (yargs) => {
    return yargs.positional('code', {
      type: 'string',
      describe: 'The log code to decode (e.g., BE.1000.01.02.01.W)'
    });
  }, (argv) => {
    const { code } = argv;
    
    if (!isValidLogCode(code as string)) {
      console.error(chalk.red(`Invalid log code format: ${code}`));
      console.error(chalk.yellow('Format should be: ENV.SERVICE.CATEGORY.ACTION.OUTCOME.SEVERITY'));
      console.error(chalk.yellow('Example: BE.1000.01.02.01.W'));
      process.exit(1);
    }
    
    const decoded = decodeLogCode(code as string);
    
    if (!decoded) {
      console.error(chalk.red(`Failed to decode log code: ${code}`));
      process.exit(1);
    }
    
    // Display a beautiful formatted table
    const data = [
      [chalk.bold('Segment'), chalk.bold('Code'), chalk.bold('Key'), chalk.bold('Description')],
      ['Environment', decoded.env.code, decoded.env.key || '-', decoded.env.description],
      ['Service', decoded.service.code, decoded.service.key || '-', decoded.service.description],
      ['Category', decoded.category.code, decoded.category.key || '-', decoded.category.description],
      ['Action', decoded.action.code, decoded.action.key || '-', decoded.action.description],
      ['Outcome', decoded.outcome.code, decoded.outcome.key || '-', decoded.outcome.description],
      ['Severity', decoded.severity.code, decoded.severity.key || '-', decoded.severity.description]
    ];
    
    console.log(chalk.green(`\nDecoding Log Code: ${chalk.bold(code)}\n`));
    console.log(table(data));
    
    console.log(chalk.cyan('\nHuman-readable description:'));
    console.log(chalk.white(getLogCodeDescription(code as string)));
  })
  .command('generate', 'Generate a log code using interactive prompts', (yargs) => {
    return yargs;
  }, async () => {
    try {
      // For simplicity in this implementation - would use inquirer in a full implementation
      // Display available options for each segment
      console.log(chalk.green('\nAvailable Environment Codes:'));
      Object.entries(LOG_CODES.ENV).forEach(([key, value]) => {
        console.log(`  ${chalk.cyan(value)} - ${key}`);
      });
      
      console.log(chalk.green('\nAvailable Service Codes:'));
      Object.entries(LOG_CODES.SERVICE).forEach(([key, value]) => {
        console.log(`  ${chalk.cyan(value)} - ${key}`);
      });
      
      console.log(chalk.green('\nAvailable Category Codes:'));
      Object.entries(LOG_CODES.CATEGORY).forEach(([key, value]) => {
        console.log(`  ${chalk.cyan(value)} - ${key}`);
      });
      
      console.log(chalk.green('\nAvailable Action Codes:'));
      Object.entries(LOG_CODES.ACTION).forEach(([key, value]) => {
        console.log(`  ${chalk.cyan(value)} - ${key}`);
      });
      
      console.log(chalk.green('\nAvailable Outcome Codes:'));
      Object.entries(LOG_CODES.OUTCOME).forEach(([key, value]) => {
        console.log(`  ${chalk.cyan(value)} - ${key}`);
      });
      
      console.log(chalk.green('\nAvailable Severity Codes:'));
      Object.entries(LOG_CODES.SEVERITY).forEach(([key, value]) => {
        console.log(`  ${chalk.cyan(value)} - ${key}`);
      });
      
      console.log(chalk.yellow('\nTo generate a code, use the interactive build command:'));
      console.log(chalk.cyan('logme build <env> <service> <category> <action> <outcome> <severity>'));
    } catch (error) {
      console.error(chalk.red('Error generating log code:'), error);
    }
  })
  .command('build <env> <service> <category> <action> <outcome> <severity>', 'Build a log code with specific segments', (yargs) => {
    return yargs
      .positional('env', {
        type: 'string',
        describe: 'Environment code (e.g., FE, BE)'
      })
      .positional('service', {
        type: 'string',
        describe: 'Service code (e.g., 1001, 1002)'
      })
      .positional('category', {
        type: 'string',
        describe: 'Category code (e.g., 01, 02)'
      })
      .positional('action', {
        type: 'string',
        describe: 'Action code (e.g., 01, 02, 03)'
      })
      .positional('outcome', {
        type: 'string',
        describe: 'Outcome code (e.g., 01, 02, 03, 04)'
      })
      .positional('severity', {
        type: 'string',
        describe: 'Severity code (e.g., I, W, E, D)'
      });
  }, (argv) => {
    try {
      const { env, service, category, action, outcome, severity } = argv;
      
      // Validate each segment against the available codes
      const isValidEnv = Object.values(LOG_CODES.ENV).includes(env as any);
      const isValidService = Object.values(LOG_CODES.SERVICE).includes(service as any);
      const isValidCategory = Object.values(LOG_CODES.CATEGORY).includes(category as any);
      const isValidAction = Object.values(LOG_CODES.ACTION).includes(action as any);
      const isValidOutcome = Object.values(LOG_CODES.OUTCOME).includes(outcome as any);
      const isValidSeverity = Object.values(LOG_CODES.SEVERITY).includes(severity as any);
      
      if (!isValidEnv || !isValidService || !isValidCategory || !isValidAction || !isValidOutcome || !isValidSeverity) {
        console.error(chalk.red('Invalid segment values. Use `logme generate` to see available options.'));
        process.exit(1);
      }
      
      const code = generateLogCode(
        env as any, 
        service as any, 
        category as any, 
        action as any, 
        outcome as any, 
        severity as any
      );
      
      console.log(chalk.green('\nGenerated Log Code:'));
      console.log(chalk.bold(code));
      
      console.log(chalk.cyan('\nDecoded Meaning:'));
      console.log(chalk.white(getLogCodeDescription(code)));
    } catch (error) {
      console.error(chalk.red('Error building log code:'), error);
    }
  })
  .command('list [segment]', 'List all available codes for a segment', (yargs) => {
    return yargs.positional('segment', {
      type: 'string',
      describe: 'Segment to list codes for (env, service, category, action, outcome, severity)',
      choices: ['env', 'service', 'category', 'action', 'outcome', 'severity']
    });
  }, (argv) => {
    const { segment } = argv;
    
    if (!segment) {
      // List all segments
      console.log(chalk.green('\nAll Available Log Code Segments:'));
      
      console.log(chalk.cyan('\nEnvironments:'));
      Object.entries(LOG_CODES.ENV).forEach(([key, value]) => {
        console.log(`  ${chalk.bold(value)} - ${key}`);
      });
      
      console.log(chalk.cyan('\nServices:'));
      Object.entries(LOG_CODES.SERVICE).forEach(([key, value]) => {
        console.log(`  ${chalk.bold(value)} - ${key}`);
      });
      
      console.log(chalk.cyan('\nCategories:'));
      Object.entries(LOG_CODES.CATEGORY).forEach(([key, value]) => {
        console.log(`  ${chalk.bold(value)} - ${key}`);
      });
      
      console.log(chalk.cyan('\nActions:'));
      Object.entries(LOG_CODES.ACTION).forEach(([key, value]) => {
        console.log(`  ${chalk.bold(value)} - ${key}`);
      });
      
      console.log(chalk.cyan('\nOutcomes:'));
      Object.entries(LOG_CODES.OUTCOME).forEach(([key, value]) => {
        console.log(`  ${chalk.bold(value)} - ${key}`);
      });
      
      console.log(chalk.cyan('\nSeverities:'));
      Object.entries(LOG_CODES.SEVERITY).forEach(([key, value]) => {
        console.log(`  ${chalk.bold(value)} - ${key}`);
      });
      
      return;
    }
    
    // List specific segment
    const segmentMap: Record<string, keyof typeof LOG_CODES> = {
      'env': 'ENV',
      'service': 'SERVICE',
      'category': 'CATEGORY',
      'action': 'ACTION',
      'outcome': 'OUTCOME',
      'severity': 'SEVERITY'
    };
    
    const segmentKey = segmentMap[segment];
    
    if (!segmentKey) {
      console.error(chalk.red(`Invalid segment: ${segment}`));
      process.exit(1);
    }
    
    console.log(chalk.green(`\nAvailable ${segment.charAt(0).toUpperCase() + segment.slice(1)} Codes:`));
    
    const data = [
      [chalk.bold('Key'), chalk.bold('Code')],
      ...Object.entries(LOG_CODES[segmentKey]).map(([key, value]) => [key, value])
    ];
    
    console.log(table(data));
  })
  .demandCommand(1, 'You need to specify a command.')
  .help()
  .alias('h', 'help')
  .version()
  .alias('v', 'version')
  .epilogue('For more information, visit https://github.com/username/logme')
  .strict();

cli.parse(); 