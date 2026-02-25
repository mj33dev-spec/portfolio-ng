import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_MODULES } from '../../shared/shared-modules';

interface TreeNode {
  title: string;
  key: string;
  type?: 'post' | 'get' | 'pure';
  expanded?: boolean;
  children?: TreeNode[];
}

@Component({
  selector: 'app-directory',
  imports: [CommonModule, SHARED_MODULES],
  templateUrl: './directory.html',
  styleUrl: './directory.scss'
})
export class Directory {
  nodes: TreeNode[] = [
    {
      title: 'Overview',
      key: 'overview',
      expanded: true
    },
    {
      title: 'Endpoints',
      key: 'endpoints',
      expanded: true,
      children: [
        {
          title: 'Root',
          key: 'root',
          expanded: true,
          children: [
            {
              title: 'Get Address (3)',
              key: 'get-address',
              expanded: true,
              children: [
                {
                  title: 'discriminator with... (1)',
                  key: 'discriminator',
                  type: 'post'
                },
                {
                  title: 'get users by id',
                  key: 'get-users',
                  type: 'get'
                }
              ]
            },
            {
              title: 'Untitled Endpoint',
              key: 'untitled-1',
              type: 'pure'
            },
            {
              title: 'Untitled Endpoint',
              key: 'untitled-2',
              type: 'pure'
            }
          ]
        }
      ]
    },
    {
      title: 'Components',
      key: 'components',
      expanded: false
    },
    {
      title: 'Requests',
      key: 'requests',
      expanded: false
    },
    {
      title: 'Schemas',
      key: 'schemas',
      expanded: false
    }
  ];

  toggleNode(node: TreeNode) {
    node.expanded = !node.expanded;
  }
}
