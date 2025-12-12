/**
 * Test Permission Check API
 * Simulates the exact call Bee2App makes to AppHub
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('='.repeat(70))
  console.log('PERMISSION CHECK DIAGNOSTIC')
  console.log('='.repeat(70))
  console.log()

  // Get the user
  const user = await prisma.user.findFirst({
    where: {
      email: 'spinola.development@outlook.com'
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  })

  if (!user) {
    console.log('❌ User not found!')
    return
  }

  console.log('👤 USER:')
  console.log(`   Email: ${user.email}`)
  console.log(`   ID: ${user.id}`)
  console.log(`   Global Role: ${user.role}`)
  console.log()

  // Get entities
  const memberships = await prisma.membership.findMany({
    where: {
      userId: user.id
    },
    include: {
      entity: true
    }
  })

  if (memberships.length === 0) {
    console.log('❌ No memberships found!')
    return
  }

  console.log('🔗 MEMBERSHIPS:')
  memberships.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.entity.name} (${m.entity.slug})`)
    console.log(`      Entity ID: ${m.entity.id}`)
    console.log(`      Membership Role: ${m.role}`)
    console.log(`      Membership ID: ${m.id}`)
  })
  console.log()

  // Test permission check logic for each membership
  console.log('🧪 TESTING PERMISSION CHECK LOGIC:')
  console.log('-'.repeat(70))

  const rolePermissions: Record<string, string[]> = {
    OWNER: ['*'],
    ADMIN: ['*'],
    MANAGER: [
      'create_work_orders',
      'edit_work_orders',
      'view_work_orders',
      'assign_work_orders',
      'delete_work_orders',
      'manage_categories'
    ],
    MEMBER: ['create_work_orders', 'view_work_orders', 'edit_own_work_orders']
  }

  for (const membership of memberships) {
    console.log()
    console.log(`Testing: ${membership.entity.name}`)
    console.log(`   Original role from DB: "${membership.role}"`)
    console.log(`   Uppercase role: "${membership.role.toUpperCase()}"`)

    const upperRole = membership.role.toUpperCase()
    const permissions = rolePermissions[upperRole]

    console.log(`   Matched permissions:`, permissions || 'NONE (undefined)')

    if (!permissions) {
      console.log(`   ❌ PROBLEM: Role "${upperRole}" not found in permission matrix!`)
      console.log(`   Available roles:`, Object.keys(rolePermissions))
    } else if (permissions.includes('*')) {
      console.log(`   ✅ Has ALL permissions (wildcard)`)
    } else {
      console.log(`   ✅ Has specific permissions:`, permissions)
    }

    // Test specific permission
    const testPermission = 'view_work_orders'
    const hasPermission = permissions
      ? permissions.includes('*') || permissions.includes(testPermission)
      : false

    console.log(`   Testing "${testPermission}": ${hasPermission ? '✅ ALLOWED' : '❌ DENIED'}`)
  }

  console.log()
  console.log('='.repeat(70))
  console.log('SIMULATING API CALL')
  console.log('='.repeat(70))
  console.log()

  const firstMembership = memberships[0]
  const testPayload = {
    userId: user.id,
    entityId: firstMembership.entity.id,
    permission: 'view_work_orders'
  }

  console.log('📤 Request body Bee2App would send:')
  console.log(JSON.stringify(testPayload, null, 2))
  console.log()

  // Simulate the exact logic from the API route
  const membership = await prisma.membership.findUnique({
    where: {
      userId_entityId: {
        userId: testPayload.userId,
        entityId: testPayload.entityId
      }
    }
  })

  console.log('📥 Database query result:')
  if (!membership) {
    console.log('   ❌ NO MEMBERSHIP FOUND!')
  } else {
    console.log('   ✅ Membership found:')
    console.log(`      ID: ${membership.id}`)
    console.log(`      Role: "${membership.role}"`)
    console.log(`      Created: ${membership.createdAt}`)
  }
  console.log()

  if (membership) {
    const userRole = membership.role.toUpperCase()
    const allowedPermissions = rolePermissions[userRole] || []
    const hasPermission = allowedPermissions.includes('*') || allowedPermissions.includes(testPayload.permission)

    console.log('🔍 Permission Check Logic:')
    console.log(`   Role (uppercase): "${userRole}"`)
    console.log(`   Allowed permissions:`, allowedPermissions)
    console.log(`   Requested permission: "${testPayload.permission}"`)
    console.log(`   Result: ${hasPermission ? '✅ ALLOWED' : '❌ DENIED'}`)
    console.log()

    console.log('📤 API would return:')
    console.log(JSON.stringify({ hasPermission }, null, 2))
  }

  console.log()
  console.log('='.repeat(70))
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
